/**
 * Analytics Utility Module
 * Manages IST (Asia/Kolkata) date calculations, rolling 30-day windows,
 * and anonymous privacy-preserving device identification.
 */

export const STORAGE_KEY_DEVICE_ID = "hriday_analytics_device_id";
export const STORAGE_KEY_REMEMBER = "hriday_analytics_remember";
export const STORAGE_KEY_EXCLUDE_ADMIN = "hriday_analytics_exclude_admin";
export const SESSION_KEY_DEVICE_ID = "hriday_analytics_session_device_id";

/**
 * Generates an anonymous random UUID (v4)
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback if randomUUID fails
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the current date in Asia/Kolkata (IST) timezone formatted as YYYY-MM-DD
 */
export function getISTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Generates an array of all dates in the rolling 30-day window ending today (IST).
 * Returns exactly 30 items ordered from oldest to today.
 */
export function getLast30DaysIST(): string[] {
  const dates: string[] = [];
  const now = new Date();
  const todayStr = getISTDateString(now);
  const [year, month, day] = todayStr.split("-").map(Number);

  for (let i = 29; i >= 0; i--) {
    const target = new Date(Date.UTC(year, month - 1, day - i));
    const y = target.getUTCFullYear();
    const m = String(target.getUTCMonth() + 1).padStart(2, "0");
    const d = String(target.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
  }
  return dates;
}

/**
 * Formats a YYYY-MM-DD string into a concise chart label (e.g. "Oct 2", "Sep 3")
 */
export function formatChartDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD string into a full human-readable date (e.g. "October 2, 2026")
 */
export function formatFullDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Checks whether device remembering is currently enabled on this browser
 */
export function isDeviceRemembered(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = localStorage.getItem(STORAGE_KEY_REMEMBER);
    return value === "true";
  } catch {
    return false;
  }
}

/**
 * Checks whether this device should be excluded from view counting
 */
export function isDeviceExcluded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(STORAGE_KEY_REMEMBER) === "true" ||
      localStorage.getItem(STORAGE_KEY_EXCLUDE_ADMIN) === "true"
    );
  } catch {
    return false;
  }
}

/**
 * Retrieves or initializes the anonymous device ID.
 */
export function getOrCreateAnonymousDeviceId(): { deviceId: string; remember: boolean } {
  if (typeof window === "undefined") {
    return { deviceId: "server", remember: false };
  }

  const remember = isDeviceRemembered();

  if (remember) {
    let deviceId = "";
    try {
      deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID) || "";
    } catch {
      // ignore
    }

    if (!deviceId) {
      deviceId = generateUUID();
      try {
        localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      } catch {
        // ignore
      }
    }
    return { deviceId, remember: true };
  } else {
    let deviceId = "";
    try {
      deviceId = sessionStorage.getItem(SESSION_KEY_DEVICE_ID) || "";
    } catch {
      // ignore
    }

    if (!deviceId) {
      deviceId = generateUUID();
      try {
        sessionStorage.setItem(SESSION_KEY_DEVICE_ID, deviceId);
      } catch {
        // ignore
      }
    }
    return { deviceId, remember: false };
  }
}

/**
 * Toggles or updates the device remembering setting on this browser.
 */
export function setRememberDevice(enabled: boolean): void {
  if (typeof window === "undefined") return;

  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY_REMEMBER, "true");
      localStorage.setItem(STORAGE_KEY_EXCLUDE_ADMIN, "true");
      let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
      if (!deviceId) {
        const sessionDevice = sessionStorage.getItem(SESSION_KEY_DEVICE_ID);
        deviceId = sessionDevice || generateUUID();
        localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
      }
    } else {
      localStorage.setItem(STORAGE_KEY_REMEMBER, "false");
      localStorage.removeItem(STORAGE_KEY_EXCLUDE_ADMIN);
      localStorage.removeItem(STORAGE_KEY_DEVICE_ID);
      sessionStorage.setItem(SESSION_KEY_DEVICE_ID, generateUUID());
    }
  } catch {
    // ignore
  }
}
