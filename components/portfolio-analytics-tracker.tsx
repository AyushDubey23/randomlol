"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateAnonymousDeviceId, isDeviceExcluded } from "@/lib/analytics-utils";

export default function PortfolioAnalyticsTracker() {
  const pathname = usePathname();
  const hasTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    // Never track /view or API calls
    if (!pathname || pathname.startsWith("/view") || pathname.startsWith("/api")) {
      return;
    }

    // Prevent double-tracking on the same page within the same component mount
    if (hasTrackedRef.current === pathname) {
      return;
    }
    hasTrackedRef.current = pathname;

    // Execute asynchronously and non-blocking
    const trackView = async () => {
      try {
        const { deviceId, remember } = getOrCreateAnonymousDeviceId();

        // Use keepalive fetch for reliability even if visitor navigates away quickly
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceId,
            rememberDevice: remember,
            path: pathname,
          }),
          keepalive: true,
        }).catch(() => {
          // Completely silent fallback; never disrupt portfolio visitors
        });
      } catch {
        // Silent catch
      }
    };

    // Run non-blocking on idle / microtask
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => trackView());
      } else {
        setTimeout(trackView, 100);
      }
    }
  }, [pathname]);

  return null;
}
