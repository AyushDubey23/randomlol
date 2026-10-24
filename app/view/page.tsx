"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Eye,
  Users,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Sliders,
  FileDown,
  Smartphone,
  Laptop,
  Tablet,
  Activity,
  Copy,
  Check,
  Sparkles,
  Repeat,
  FileText,
  Lock,
  KeyRound,
  AlertCircle,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  getLast30DaysIST,
  formatChartDate,
  formatFullDate,
  formatTimeAgo,
  isDeviceRemembered,
  setRememberDevice,
} from "@/lib/analytics-utils";

interface DayData {
  date: string;
  label: string;
  fullDate: string;
  views: number;
  unique: number;
  downloads: number;
}

interface ActivityEvent {
  id: string;
  timestamp: number;
  isoTime?: string;
  date: string;
  time: string;
  ip: string;
  device: string;
  deviceType: "Mobile" | "Tablet" | "Desktop";
  path: string;
  action: "page_view" | "resume_download" | "ayush_click";
  deviceId: string;
  isFirstTime: boolean;
  visitCount?: number;
  sawResume: boolean;
  clickedAyushLink: boolean;
}

const PIN_STORAGE_KEY = "hriday_admin_auth_token";

export default function AnalyticsViewPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Analytics data state
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [totalResumeDownloads, setTotalResumeDownloads] = useState(0);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [recentViews, setRecentViews] = useState<ActivityEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("Loading...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customIpInput, setCustomIpInput] = useState("");

  // Device remembering toggle state
  const [rememberDeviceState, setRememberDeviceState] = useState(false);
  const [rememberNotice, setRememberNotice] = useState<string | null>(null);

  // Client hydration flag
  const [mounted, setMounted] = useState(false);

  // Secure PIN submission via API route
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setVerifying(true);
    setPinError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok && data?.token) {
        sessionStorage.setItem(PIN_STORAGE_KEY, data.token);
        setIsAuthenticated(true);
        setPinError(null);
        setPinInput("");
      } else {
        setPinError(data?.message || "Invalid security PIN");
        setPinInput("");
      }
    } catch {
      setPinError("Verification error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    setIsAuthenticated(false);
    setPinInput("");
  };

  // Copy IP handler with user feedback
  const handleCopyIp = async (ip: string, eventId: string) => {
    if (!ip || ip === "Unknown IP") return;
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedId(eventId);
      setTimeout(() => {
        setCopiedId((prev) => (prev === eventId ? null : prev));
      }, 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = ip;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(eventId);
      setTimeout(() => {
        setCopiedId((prev) => (prev === eventId ? null : prev));
      }, 2000);
    }
  };

  // Fetch 30-day analytics data & recent activity
  const loadAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setAnalyticsLoading(true);
    }

    const dates = getLast30DaysIST();
    const oldestDate = dates[0];
    const todayDate = dates[dates.length - 1];

    // ==========================================
    // 1. Fetch daily views from Firestore
    // ==========================================
    try {
      const dailyRef = collection(db, "analytics_daily");
      const dailyQuery = query(dailyRef, where("date", ">=", oldestDate));
      const dailySnapshot = await getDocs(dailyQuery);

      const dailyMap = new Map<
        string,
        { totalViews: number; uniqueVisitors: number; resumeDownloads: number }
      >();
      let sumDownloads = 0;

      dailySnapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        const downloads = Number(data.resumeDownloads) || 0;
        sumDownloads += downloads;
        dailyMap.set(docSnap.id, {
          totalViews: Number(data.totalViews) || 0,
          uniqueVisitors: Number(data.uniqueVisitors) || 0,
          resumeDownloads: downloads,
        });
      });

      setTotalResumeDownloads(sumDownloads);

      // Construct array with all 30 days present (with exact numbers or 0)
      let sumViews = 0;
      const formattedChart: DayData[] = dates.map((dateStr) => {
        const dayRecord = dailyMap.get(dateStr);
        const dayViews = dayRecord ? dayRecord.totalViews : 0;
        const dayUnique = dayRecord ? dayRecord.uniqueVisitors : 0;
        const dayDownloads = dayRecord ? dayRecord.resumeDownloads : 0;
        sumViews += dayViews;

        return {
          date: dateStr,
          label: formatChartDate(dateStr),
          fullDate: formatFullDate(dateStr),
          views: dayViews,
          unique: dayUnique,
          downloads: dayDownloads,
        };
      });

      setChartData(formattedChart);
      setTotalViews(sumViews);

      const todayRecord = dailyMap.get(todayDate);
      setTodayViews(todayRecord ? todayRecord.totalViews : 0);
    } catch (chartErr) {
      console.error("Daily chart fetch error:", chartErr);
    }

    // ==========================================
    // 2. Fetch unique visitors count
    // ==========================================
    try {
      const devicesRef = collection(db, "analytics_devices");
      try {
        const countSnapshot = await getCountFromServer(devicesRef);
        setUniqueVisitors(countSnapshot.data().count);
      } catch {
        const devicesSnapshot = await getDocs(devicesRef);
        setUniqueVisitors(devicesSnapshot.size);
      }
    } catch (devicesErr) {
      console.error("Devices count fetch error:", devicesErr);
    }

    // ==========================================
    // 3. Fetch recent views log & devices list
    // ==========================================
    try {
      const eventMap = new Map<string, ActivityEvent>();

      // A. Load from analytics_daily/recent_events_log (real-time stream)
      try {
        const feedRef = doc(db, "analytics_daily", "recent_events_log");
        const feedSnap = await getDoc(feedRef);
        if (feedSnap.exists() && Array.isArray(feedSnap.data().events)) {
          feedSnap.data().events.forEach((ev: any) => {
            if (ev && ev.id) {
              eventMap.set(ev.id, {
                id: ev.id,
                timestamp: ev.timestamp || (ev.isoTime ? new Date(ev.isoTime).getTime() : Date.now()),
                isoTime: ev.isoTime,
                date: ev.date || todayDate,
                time: ev.time || "Recent",
                ip: ev.ip || "Unknown IP",
                device: ev.device || "Unknown Device",
                deviceType: ev.deviceType || "Desktop",
                path: ev.path || "/",
                action: ev.action || "page_view",
                deviceId: ev.deviceId || "",
                isFirstTime: Boolean(ev.isFirstTime ?? (ev.visitCount <= 1)),
                visitCount: ev.visitCount || 1,
                sawResume: Boolean(ev.sawResume || ev.action === "resume_download"),
                clickedAyushLink: Boolean(ev.clickedAyushLink || ev.action === "ayush_click"),
              });
            }
          });
        }
      } catch (feedErr) {
        console.warn("Could not read recent_events_log, falling back to devices:", feedErr);
      }

      // B. Load from analytics_devices (all historical visitors)
      try {
        const devicesRef = collection(db, "analytics_devices");
        const devSnapshot = await getDocs(devicesRef);
        devSnapshot.forEach((docSnap: any) => {
          const dev = docSnap.data();
          const devId = docSnap.id;
          const timeVal = dev.lastSeen || dev.firstSeen || new Date().toISOString();
          const timestamp = new Date(timeVal).getTime() || Date.now();
          const syntheticId = `dev_${devId}`;

          // If no specific event logged for this device yet, add it
          const alreadyLogged = Array.from(eventMap.values()).some((e) => e.deviceId === devId);
          if (!alreadyLogged) {
            const visitCount = Number(dev.visitCount) || 1;
            const sawResume = Boolean(dev.sawResume || dev.hasSeenResume);
            const clickedAyushLink = Boolean(dev.clickedAyushLink);

            eventMap.set(syntheticId, {
              id: syntheticId,
              timestamp,
              isoTime: timeVal,
              date: dev.lastSeenDate || todayDate,
              time: new Date(timestamp).toLocaleTimeString("en-US", {
                timeZone: "Asia/Kolkata",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              ip: dev.ip || "Unknown IP",
              device: dev.device || "Desktop",
              deviceType: dev.deviceType || "Desktop",
              path: sawResume ? "/resume" : "/",
              action: sawResume ? "resume_download" : "page_view",
              deviceId: devId,
              isFirstTime: visitCount <= 1,
              visitCount,
              sawResume,
              clickedAyushLink,
            });
          }
        });
      } catch (devsErr) {
        console.error("Could not fetch analytics_devices fallback:", devsErr);
      }

      // Convert map to sorted array (latest first)
      const mergedList = Array.from(eventMap.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setRecentViews(mergedList.slice(0, 50));
    } catch (recentErr) {
      console.error("Recent activity fetch error:", recentErr);
    } finally {
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setAnalyticsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setRememberDeviceState(isDeviceRemembered());

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(PIN_STORAGE_KEY);
      if (stored && stored.length > 10) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated, loadAnalytics]);

  // Toggle "Remember this device"
  const handleToggleRemember = () => {
    const nextState = !rememberDeviceState;
    setRememberDevice(nextState);
    setRememberDeviceState(nextState);
    setRememberNotice(
      nextState
        ? "Remember this device is ON. Views from this device will not be counted."
        : "Remember this device is OFF. Future visits from this device will be counted as views."
    );
    setTimeout(() => setRememberNotice(null), 4000);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#090909] text-white" />;
  }

  // PIN Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 selection:bg-neutral-800">
        <div className="w-full max-w-sm border border-neutral-800 bg-[#111111] p-8 shadow-2xl relative">
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-12 h-12 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center">
              <Lock className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h1 className="text-xl font-light tracking-[0.25em] uppercase text-white">
                HRIDAY BAJAJ
              </h1>
              <p className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase mt-0.5">
                Analytics Portal
              </p>
            </div>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Enter Security PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  className={`w-full bg-[#181818] border ${
                    pinError ? "border-red-500 text-red-300" : "border-neutral-700 text-white"
                  } px-4 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:border-white transition-colors`}
                />
                <KeyRound className="w-4 h-4 text-neutral-500 absolute right-3 top-3.5 pointer-events-none" />
              </div>
              {pinError && (
                <p className="text-xs text-red-400 font-mono mt-1.5 flex items-center space-x-1 justify-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 bg-white text-black text-xs font-mono uppercase tracking-widest font-semibold hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Unlock Analytics"}
            </button>
          </form>

          <p className="text-center text-[10px] text-neutral-600 font-mono mt-6">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  const firstDate = chartData.length > 0 ? chartData[0].label : "";
  const lastDate = chartData.length > 0 ? chartData[chartData.length - 1].label : "";

  return (
    <div className="min-h-screen bg-[#090909] text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white pb-20">
      {/* Top Bar */}
      <header className="border-b border-neutral-800/80 bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-light tracking-[0.25em] text-white">
                HRIDAY BAJAJ
              </h1>
              <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-neutral-700 bg-neutral-900 text-neutral-300 font-mono">
                Private
              </span>
            </div>
            <p className="text-[11px] tracking-[0.2em] text-neutral-400 uppercase mt-0.5 font-mono">
              Portfolio Analytics
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono text-neutral-400">
                Last 30 Days
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-500 font-mono">
                Asia/Kolkata (IST)
              </span>
            </div>

            <button
              onClick={() => loadAnalytics(true)}
              disabled={isRefreshing || analyticsLoading}
              title="Refresh Analytics Data"
              className="p-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing || analyticsLoading ? "animate-spin text-white" : ""}`}
              />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Lock Analytics Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-10 space-y-10">
        {/* Notification Toast for device remembering */}
        {rememberNotice && (
          <div className="p-3 border border-neutral-700 bg-neutral-900 text-neutral-300 text-xs flex items-center space-x-2.5 transition-all">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{rememberNotice}</span>
          </div>
        )}

        {/* Metric Cards Row - 4 Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Views */}
          <div className="border border-neutral-800/90 bg-[#121212] p-7 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400">
                  Total Views
                </span>
                <Eye className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-4xl font-light tracking-tight text-white font-mono my-2">
                {analyticsLoading ? "..." : totalViews.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-neutral-500 tracking-wider font-light mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
              <span>Last 30 Days</span>
              <span className="text-[10px] font-mono text-neutral-400">Traffic</span>
            </div>
          </div>

          {/* Card 2: Unique Visitors */}
          <div className="border border-neutral-800/90 bg-[#121212] p-7 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400">
                  Unique Visitors
                </span>
                <Users className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-4xl font-light tracking-tight text-white font-mono my-2">
                {analyticsLoading ? "..." : uniqueVisitors.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-neutral-500 tracking-wider font-light mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
              <span>Last 30 Days</span>
              <span className="text-[10px] font-mono text-neutral-400">Deduplicated</span>
            </div>
          </div>

          {/* Card 3: Today's Views */}
          <div className="border border-neutral-800/90 bg-[#121212] p-7 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400">
                  Today
                </span>
                <Calendar className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-4xl font-light tracking-tight text-white font-mono my-2">
                {analyticsLoading ? "..." : todayViews.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-neutral-500 tracking-wider font-light mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
              <span>Views</span>
              <span className="text-[10px] font-mono text-neutral-400">IST Timezone</span>
            </div>
          </div>

          {/* Card 4: Resume Downloads */}
          <div className="border border-neutral-800/90 bg-[#121212] p-7 flex flex-col justify-between transition-colors hover:border-neutral-700">
            <div>
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-neutral-400">
                  Resume Downloads
                </span>
                <FileDown className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-4xl font-light tracking-tight text-white font-mono my-2">
                {analyticsLoading ? "..." : totalResumeDownloads.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-neutral-500 tracking-wider font-light mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
              <span>Last 30 Days</span>
              <span className="text-[10px] font-mono text-emerald-400">CV Clicks</span>
            </div>
          </div>
        </section>

        {/* 30-Day Views Chart Section */}
        <section className="border border-neutral-800/90 bg-[#121212] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-neutral-800/80 gap-3">
            <div>
              <h2 className="text-lg font-light tracking-[0.15em] text-white">
                VIEWS — LAST 30 DAYS
              </h2>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Daily traffic trend from {firstDate} to {lastDate}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
              <span className="inline-block w-2.5 h-2.5 bg-white border border-neutral-400" />
              <span>Page Views</span>
            </div>
          </div>

          {/* Chart Display */}
          <div className="w-full h-72 sm:h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#222222"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#555555"
                    fontSize={11}
                    tickLine={false}
                    interval="preserveStartEnd"
                    fontFamily="monospace"
                  />
                  <YAxis
                    stroke="#555555"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
                    fontFamily="monospace"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DayData;
                        return (
                          <div className="bg-[#1c1c1c] border border-neutral-700 px-3.5 py-2.5 shadow-xl font-sans">
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {data.fullDate}
                            </p>
                            <p className="text-sm font-medium text-white mt-1">
                              {data.views} {data.views === 1 ? "view" : "views"}
                            </p>
                            {data.unique > 0 && (
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                {data.unique} unique visitor{data.unique === 1 ? "" : "s"}
                              </p>
                            )}
                            {data.downloads > 0 && (
                              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                {data.downloads} resume download{data.downloads === 1 ? "" : "s"}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#ffffff", stroke: "#121212", strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }}
                    fillOpacity={1}
                    fill="url(#viewsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500 font-mono">
                {analyticsLoading ? "Loading view data..." : "No view activity recorded in this period yet."}
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="border border-neutral-800/90 bg-[#121212] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-neutral-800/80 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-lg font-light tracking-[0.15em] text-white">
                  RECENT VISITOR ACTIVITY
                </h2>
              </div>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Live stream of visitors with relative time, IP addresses, tags, and engagement
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const clean = customIpInput.trim();
                  if (clean) {
                    window.open(
                      `https://www.opentracker.net/feature/ip-tracker?ip=${encodeURIComponent(clean)}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
                className="flex items-center space-x-1.5"
              >
                <input
                  type="text"
                  placeholder="Track IP (e.g. 115.248.83.149)"
                  value={customIpInput}
                  onChange={(e) => setCustomIpInput(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 focus:border-neutral-600 px-2.5 py-1 text-xs font-mono text-white placeholder-neutral-500 rounded-sm focus:outline-none w-48 sm:w-56"
                />
                <button
                  type="submit"
                  disabled={!customIpInput.trim()}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-neutral-200 hover:bg-white text-black text-[11px] font-mono uppercase tracking-wider font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm cursor-pointer"
                  title="Open Opentracker for this IP"
                >
                  <span>Track IP</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </button>
              </form>

              <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 border border-neutral-800 bg-neutral-900 text-neutral-400">
                Live Feed ({recentViews.length} Events)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {recentViews.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-wider text-neutral-400">
                    <th className="pb-3 font-normal">Visited</th>
                    <th className="pb-3 font-normal">Visitor / Device</th>
                    <th className="pb-3 font-normal">IP Address</th>
                    <th className="pb-3 font-normal">Visitor Type</th>
                    <th className="pb-3 font-normal">Engagement</th>
                    <th className="pb-3 font-normal text-right">Path</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {recentViews.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-900/60 transition-colors">
                      {/* 1. Time (relative + exact) */}
                      <td className="py-3.5 pr-4 text-neutral-300 whitespace-nowrap">
                        <span className="block text-white font-medium capitalize">
                          {formatTimeAgo(item.timestamp || item.isoTime)}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {item.time || "IST"} • {item.date}
                        </span>
                      </td>

                      {/* 2. Visitor Name / Device with small blue dot if clicked Ayush link */}
                      <td className="py-3.5 pr-4 text-neutral-200">
                        <div className="flex items-center space-x-2">
                          {item.clickedAyushLink && (
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] ring-2 ring-blue-500/20 shrink-0"
                              title="Engaged visitor"
                            />
                          )}
                          {item.deviceType === "Mobile" ? (
                            <Smartphone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          ) : item.deviceType === "Tablet" ? (
                            <Tablet className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[180px] sm:max-w-xs text-neutral-200">
                            {item.device}
                          </span>
                        </div>
                      </td>

                      {/* 3. IP Address with Copy & Track Buttons */}
                      <td className="py-3.5 pr-4 text-neutral-300 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-1 bg-neutral-900/90 border border-neutral-800 rounded-sm">
                          <span className="text-neutral-200 font-mono text-[11px]">
                            {item.ip}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyIp(item.ip, item.id)}
                            title="Copy IP Address"
                            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded hover:bg-neutral-800"
                          >
                            {copiedId === item.id ? (
                              <div className="flex items-center space-x-1 text-emerald-400">
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="text-[9px] uppercase tracking-wider font-mono">
                                  Copied
                                </span>
                              </div>
                            ) : (
                              <Copy className="w-3 h-3 shrink-0" />
                            )}
                          </button>
                          {item.ip && item.ip !== "Unknown IP" && (
                            <a
                              href={`https://www.opentracker.net/feature/ip-tracker?ip=${encodeURIComponent(item.ip)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Track IP on Opentracker (${item.ip})`}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 hover:text-sky-300 hover:bg-neutral-800 rounded transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0 text-sky-400" />
                              <span>Track</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 4. Visitor Type: Unique vs Revisiter */}
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        {item.isFirstTime || (item.visitCount && item.visitCount <= 1) ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 border border-purple-800/60 bg-purple-950/40 text-purple-300 text-[10px] uppercase font-mono tracking-wider rounded-sm">
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                            <span>Unique</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 border border-sky-800/60 bg-sky-950/40 text-sky-300 text-[10px] uppercase font-mono tracking-wider rounded-sm">
                            <Repeat className="w-2.5 h-2.5 text-sky-400" />
                            <span>
                              Revisiter{item.visitCount && item.visitCount > 1 ? ` (${item.visitCount}x)` : ""}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* 5. Engagement: Saw Resume badge */}
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        {item.sawResume || item.action === "resume_download" ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-[10px] uppercase font-mono tracking-wider rounded-sm">
                            <FileText className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Saw Resume</span>
                          </span>
                        ) : (
                          <span className="text-neutral-600 font-mono text-xs pl-2">—</span>
                        )}
                      </td>

                      {/* 6. Path */}
                      <td className="py-3.5 text-right text-neutral-400 whitespace-nowrap">
                        <code className="text-neutral-400 text-[11px] font-mono">
                          {item.path || "/"}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                {analyticsLoading ? "Loading recent visitors stream..." : "No recent visitor records yet."}
              </div>
            )}
          </div>
        </section>

        {/* Controls & Preferences Section */}
        <section className="border border-neutral-800/90 bg-[#121212] p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Device Remembering Control */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2.5">
              <Sliders className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm uppercase tracking-[0.15em] font-medium text-white">
                Remember this device
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              When turned ON, this device is remembered and excluded from counting views so your own browsing does not inflate your portfolio traffic. Toggle OFF to treat this device as a normal visitor.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              {rememberDeviceState ? "ON" : "OFF"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={rememberDeviceState}
              onClick={handleToggleRemember}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${
                rememberDeviceState ? "bg-white" : "bg-neutral-800 border border-neutral-700"
              }`}
            >
              <div
                className={`bg-neutral-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  rememberDeviceState ? "translate-x-6 bg-black" : "translate-x-0 bg-neutral-400"
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
