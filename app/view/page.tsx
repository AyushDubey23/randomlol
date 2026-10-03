"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
  limit,
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
  Clock,
  FileDown,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  Activity,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  getLast30DaysIST,
  formatChartDate,
  formatFullDate,
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

interface RecentView {
  id: string;
  createdAt: number;
  date: string;
  time: string;
  ip: string;
  device: string;
  deviceType: "Mobile" | "Tablet" | "Desktop";
  path: string;
  action: "page_view" | "resume_download";
  deviceId: string;
  isRemembered: boolean;
}

export default function AnalyticsViewPage() {
  // Analytics data state
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [totalResumeDownloads, setTotalResumeDownloads] = useState(0);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("Loading...");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Device remembering toggle state
  const [rememberDeviceState, setRememberDeviceState] = useState(false);
  const [rememberNotice, setRememberNotice] = useState<string | null>(null);

  // Client hydration flag
  const [mounted, setMounted] = useState(false);

  // Fetch 30-day analytics data directly from Firestore
  const loadAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setAnalyticsLoading(true);
    }

    try {
      const dates = getLast30DaysIST();
      const oldestDate = dates[0];
      const todayDate = dates[dates.length - 1];

      // 1. Fetch daily views from Firestore for the last 30 days
      const dailyRef = collection(db, "analytics_daily");
      const dailyQuery = query(dailyRef, where("date", ">=", oldestDate));
      const dailySnapshot = await getDocs(dailyQuery);

      const dailyMap = new Map<
        string,
        { totalViews: number; uniqueVisitors: number; resumeDownloads: number }
      >();
      let sumDownloads = 0;

      dailySnapshot.forEach((doc) => {
        const data = doc.data();
        const downloads = Number(data.resumeDownloads) || 0;
        sumDownloads += downloads;
        dailyMap.set(doc.id, {
          totalViews: Number(data.totalViews) || 0,
          uniqueVisitors: Number(data.uniqueVisitors) || 0,
          resumeDownloads: downloads,
        });
      });

      setTotalResumeDownloads(sumDownloads);

      // Construct array with all 30 days present (filling 0 for missing days)
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

      // Today's views
      const todayRecord = dailyMap.get(todayDate);
      setTodayViews(todayRecord ? todayRecord.totalViews : 0);

      // 2. Fetch unique visitors count for devices active in the last 30 days
      const devicesRef = collection(db, "analytics_devices");
      const devicesQuery = query(devicesRef, where("lastSeenDate", ">=", oldestDate));

      try {
        const countSnapshot = await getCountFromServer(devicesQuery);
        setUniqueVisitors(countSnapshot.data().count);
      } catch {
        // Fallback to getDocs if count aggregation is restricted
        const devicesSnapshot = await getDocs(devicesQuery);
        setUniqueVisitors(devicesSnapshot.size);
      }

      // 3. Fetch recent views log with IPs and Devices (last 25 events)
      let recentList: RecentView[] = [];
      try {
        const recentRef = collection(db, "analytics_recent_views");
        const recentQuery = query(recentRef, orderBy("createdAt", "desc"), limit(25));
        const recentSnap = await getDocs(recentQuery);
        recentSnap.forEach((doc) => {
          recentList.push(doc.data() as RecentView);
        });
      } catch {
        // Fallback without index requirement
        const recentRef = collection(db, "analytics_recent_views");
        const recentSnap = await getDocs(recentRef);
        recentSnap.forEach((doc) => {
          recentList.push(doc.data() as RecentView);
        });
        recentList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        recentList = recentList.slice(0, 25);
      }
      setRecentViews(recentList);

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      // Fallback: render baseline 0s for the 30 days
      const dates = getLast30DaysIST();
      setChartData(
        dates.map((dateStr) => ({
          date: dateStr,
          label: formatChartDate(dateStr),
          fullDate: formatFullDate(dateStr),
          views: 0,
          unique: 0,
          downloads: 0,
        }))
      );
      setLastUpdated("Live / Ready");
    } finally {
      setAnalyticsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setRememberDeviceState(isDeviceRemembered());
    loadAnalytics();
  }, [loadAnalytics]);

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
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
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
                    strokeWidth={2}
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

        {/* Recent Activity Section - Recent Views, IPs & Devices */}
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
                Live stream of the last 25 visits with device details and IP addresses
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 border border-neutral-800 bg-neutral-900 text-neutral-400">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            {recentViews.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-wider text-neutral-400">
                    <th className="pb-3 font-normal">Time (IST)</th>
                    <th className="pb-3 font-normal">Event</th>
                    <th className="pb-3 font-normal">Device & Browser</th>
                    <th className="pb-3 font-normal">IP Address</th>
                    <th className="pb-3 font-normal">Path</th>
                    <th className="pb-3 font-normal text-right">Visitor Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {recentViews.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-900/60 transition-colors">
                      <td className="py-3 text-neutral-300">
                        <span className="block text-white font-medium">{item.time || "Recent"}</span>
                        <span className="text-[10px] text-neutral-400">{item.date}</span>
                      </td>

                      <td className="py-3">
                        {item.action === "resume_download" ? (
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-[10px] uppercase tracking-wider">
                            <FileDown className="w-3 h-3 text-emerald-400" />
                            <span>Resume</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 border border-neutral-800 bg-neutral-900 text-neutral-300 text-[10px] uppercase tracking-wider">
                            <Eye className="w-2.5 h-2.5 text-neutral-400" />
                            <span>Page View</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-neutral-200">
                        <div className="flex items-center space-x-2">
                          {item.deviceType === "Mobile" ? (
                            <Smartphone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          ) : item.deviceType === "Tablet" ? (
                            <Tablet className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px] sm:max-w-xs">{item.device}</span>
                        </div>
                      </td>

                      <td className="py-3 text-neutral-300">
                        <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[11px]">
                          {item.ip}
                        </span>
                      </td>

                      <td className="py-3 text-neutral-400">
                        <code className="text-neutral-400">{item.path || "/"}</code>
                      </td>

                      <td className="py-3 text-right">
                        {item.isRemembered ? (
                          <span className="text-[10px] text-neutral-400 border border-neutral-800 px-2 py-0.5 bg-neutral-900/40">
                            Remembered
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-300 border border-neutral-700 px-2 py-0.5 bg-neutral-800/60">
                            New Device
                          </span>
                        )}
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
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 border border-transparent ${
                rememberDeviceState ? "bg-[#34C759]" : "bg-neutral-800 border-neutral-700/60"
              }`}
            >
              <span className="sr-only">Toggle remember device</span>
              <span
                className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                  rememberDeviceState ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Footer Meta Row */}
        <footer className="pt-2 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-neutral-500 text-xs font-mono gap-3 border-t border-neutral-900">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>Last updated: {lastUpdated}</span>
          </div>
          <div>
            <span>Primary Timezone: Asia/Kolkata (IST)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
