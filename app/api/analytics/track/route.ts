import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getISTDateString, getISTTimeString, parseUserAgent } from "@/lib/analytics-utils";
import {
  doc,
  setDoc,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// In-memory rate limiting to prevent spamming from rapid refreshes
const recentRequests = new Map<string, number>();

// Clean up stale rate-limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > 60_000) {
      recentRequests.delete(key);
    }
  }
}, 300_000);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const {
      deviceId,
      rememberDevice = false,
      path = "/",
      action = "page_view",
    } = body;

    // Validate path - Never count /view, API routes, or static files
    const cleanPath = typeof path === "string" ? path.toLowerCase().trim() : "/";
    if (
      cleanPath.startsWith("/view") ||
      cleanPath.startsWith("/api") ||
      cleanPath.match(/\.(png|jpg|jpeg|webp|svg|css|js|ico|txt|xml|json)$/i)
    ) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Validate deviceId
    if (!deviceId || typeof deviceId !== "string" || deviceId.length < 6 || deviceId.length > 128) {
      return NextResponse.json({ ok: false, message: "Invalid device identifier" }, { status: 400 });
    }

    // Rate-limiting: limit 1 view recording per device every 3 seconds for page views
    const now = Date.now();
    if (action !== "resume_download") {
      const lastRequest = recentRequests.get(deviceId);
      if (lastRequest && now - lastRequest < 3000) {
        return NextResponse.json({ ok: true, rateLimited: true });
      }
      recentRequests.set(deviceId, now);
    }

    // Get current date and time in IST (Asia/Kolkata)
    const today = getISTDateString();
    const currentTimeStr = getISTTimeString();

    // Extract IP and Device details
    const ip = getClientIp(request);
    const userAgentStr = request.headers.get("user-agent") || "";
    const { device, deviceType } = parseUserAgent(userAgentStr);

    const deviceRef = doc(db, "analytics_devices", deviceId);
    const dailyRef = doc(db, "analytics_daily", today);
    const recentViewId = `${now}_${deviceId.slice(0, 6)}`;
    const recentViewRef = doc(db, "analytics_recent_views", recentViewId);

    // 1. Handle Resume Download Event
    if (action === "resume_download") {
      await runTransaction(db, async (transaction) => {
        const dailyDoc = await transaction.get(dailyRef);
        if (dailyDoc.exists()) {
          transaction.update(dailyRef, {
            resumeDownloads: increment(1),
            lastUpdated: serverTimestamp(),
          });
        } else {
          transaction.set(dailyRef, {
            date: today,
            totalViews: 0,
            uniqueVisitors: 0,
            resumeDownloads: 1,
            lastUpdated: serverTimestamp(),
          });
        }
      });

      // Log download to recent views table
      await setDoc(recentViewRef, {
        id: recentViewId,
        createdAt: now,
        date: today,
        time: currentTimeStr,
        ip,
        device,
        deviceType,
        path: cleanPath,
        action: "resume_download",
        deviceId,
        isRemembered: Boolean(rememberDevice),
      });

      return NextResponse.json({ ok: true, action: "resume_download" });
    }

    // 2. Handle Regular Page View
    let isDuplicateRemembered = false;

    await runTransaction(db, async (transaction) => {
      const deviceDoc = await transaction.get(deviceRef);
      const dailyDoc = await transaction.get(dailyRef);

      const deviceData = deviceDoc.exists() ? deviceDoc.data() : null;
      const isNewVisitorToday = !deviceDoc.exists() || deviceData?.lastSeenDate !== today;

      // If this device is remembered and already recognized, do NOT count duplicate views
      if (rememberDevice && deviceDoc.exists()) {
        isDuplicateRemembered = true;
        const nowIso = new Date().toISOString();
        transaction.set(
          deviceRef,
          {
            lastSeen: nowIso,
            lastSeenDate: today,
            visitCount: increment(1),
          },
          { merge: true }
        );
        return;
      }

      // Update daily aggregated document
      if (dailyDoc.exists()) {
        transaction.update(dailyRef, {
          totalViews: increment(1),
          uniqueVisitors: isNewVisitorToday ? increment(1) : increment(0),
          lastUpdated: serverTimestamp(),
        });
      } else {
        transaction.set(dailyRef, {
          date: today,
          totalViews: 1,
          uniqueVisitors: 1,
          resumeDownloads: 0,
          lastUpdated: serverTimestamp(),
        });
      }

      // Update device document for deduplication and tracking
      const nowIso = new Date().toISOString();
      transaction.set(
        deviceRef,
        {
          deviceId,
          lastSeen: nowIso,
          lastSeenDate: today,
          visitCount: increment(1),
          rememberDevice: Boolean(rememberDevice),
          ip,
          device,
          deviceType,
          ...(deviceDoc.exists() ? {} : { firstSeen: nowIso }),
        },
        { merge: true }
      );
    });

    // Record view in the recent activity log (unless excluded duplicate)
    if (!isDuplicateRemembered) {
      await setDoc(recentViewRef, {
        id: recentViewId,
        createdAt: now,
        date: today,
        time: currentTimeStr,
        ip,
        device,
        deviceType,
        path: cleanPath,
        action: "page_view",
        deviceId,
        isRemembered: Boolean(rememberDevice),
      });
    }

    return NextResponse.json({ ok: true, date: today, ip, device });
  } catch (error: any) {
    console.error("Analytics tracking error:", error?.message || error);
    return NextResponse.json(
      { ok: false, message: "Tracking currently queued or unavailable" },
      { status: 200 }
    );
  }
}
