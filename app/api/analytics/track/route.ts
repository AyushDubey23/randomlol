import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getISTDateString } from "@/lib/analytics-utils";
import {
  doc,
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const { deviceId, rememberDevice = true, path = "/" } = body;

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
    if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8 || deviceId.length > 128) {
      return NextResponse.json({ ok: false, message: "Invalid device identifier" }, { status: 400 });
    }

    // Rate-limiting: limit 1 view recording per device every 4 seconds
    const now = Date.now();
    const lastRequest = recentRequests.get(deviceId);
    if (lastRequest && now - lastRequest < 4000) {
      return NextResponse.json({ ok: true, rateLimited: true });
    }
    recentRequests.set(deviceId, now);

    // Get current date in IST (Asia/Kolkata)
    const today = getISTDateString();

    const deviceRef = doc(db, "analytics_devices", deviceId);
    const dailyRef = doc(db, "analytics_daily", today);

    await runTransaction(db, async (transaction) => {
      const deviceDoc = await transaction.get(deviceRef);
      const dailyDoc = await transaction.get(dailyRef);

      const deviceData = deviceDoc.exists() ? deviceDoc.data() : null;
      const isNewVisitorToday = !deviceDoc.exists() || deviceData?.lastSeenDate !== today;

      // If this device is remembered and already recognized, do NOT count duplicate views
      if (rememberDevice && deviceDoc.exists()) {
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
          ...(deviceDoc.exists() ? {} : { firstSeen: nowIso }),
        },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true, date: today });
  } catch (error: any) {
    // Fail gracefully and silently for the client
    console.error("Analytics tracking error:", error?.message || error);
    return NextResponse.json(
      { ok: false, message: "Tracking currently queued or unavailable" },
      { status: 200 }
    );
  }
}
