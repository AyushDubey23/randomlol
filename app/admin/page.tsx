"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  KeyRound,
  Upload,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Youtube,
  HardDrive,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Save,
  LogOut,
  RefreshCw,
  FolderOpen,
  X,
  ExternalLink,
} from "lucide-react";
import {
  CustomProject,
  getCustomProjects,
  saveSingleProject,
  deleteCustomProject,
} from "@/lib/custom-projects";

const PIN_STORAGE_KEY = "hriday_admin_auth_token";

const AVAILABLE_ROLES = [
  { key: "director", label: "Director" },
  { key: "writer", label: "Writer" },
  { key: "editor", label: "Editor" },
  { key: "gaffer", label: "Gaffer" },
  { key: "producer", label: "Producer" },
  { key: "sounddesigner", label: "Sound Designer" },
  { key: "soundoperator", label: "Sound Operator" },
  { key: "photographer", label: "Photographer" },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Projects list state
  const [projects, setProjects] = useState<CustomProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("director");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SHORT FILM");
  const [videoType, setVideoType] = useState<"youtube" | "drive">("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string>("");
  const [coverSizeKb, setCoverSizeKb] = useState<number>(0);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [activeScreenshotIdx, setActiveScreenshotIdx] = useState(0);

  // Preview Modal / Sample Page state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingPublishStatus, setPendingPublishStatus] = useState<boolean>(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);

  // Load authentication status from session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(PIN_STORAGE_KEY);
      if (stored && stored.length > 10) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  const loadProjects = async () => {
    setLoading(true);
    const data = await getCustomProjects();
    setProjects(data);
    setLoading(false);
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

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

  /**
   * Multi-pass aggressive image compression for Firestore safety
   * Ensures every image is compressed to under ~150KB (cover) or ~70KB (screenshot)
   */
  const compressImage = (
    file: File,
    maxDimension = 1000,
    targetQuality = 0.72
  ): Promise<{ base64: string; sizeKb: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Scale down dimensions if greater than maxDimension
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context failed"));

          ctx.drawImage(img, 0, 0, width, height);

          let currentQuality = targetQuality;
          let dataUrl = canvas.toDataURL("image/jpeg", currentQuality);

          // If still > 160KB (approx 210,000 chars), step down quality
          while (dataUrl.length > 210000 && currentQuality > 0.35) {
            currentQuality -= 0.12;
            dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
          }

          const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
          resolve({ base64: dataUrl, sizeKb });
        };
        img.onerror = () => reject(new Error("Could not decode image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  // Handle Cover Photo Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { base64, sizeKb } = await compressImage(file, 1000, 0.72);
      setCoverPhoto(base64);
      setCoverSizeKb(sizeKb);
      showNotification(`Cover photo optimized & loaded (${sizeKb} KB)`);
    } catch {
      showNotification("Failed to process cover photo", "error");
    }
  };

  // Handle Screenshots Upload
  const handleScreenshotsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const promises = Array.from(files).map((file) => compressImage(file, 800, 0.65));
      const results = await Promise.all(promises);
      const newBase64s = results.map((r) => r.base64);
      setScreenshots((prev) => [...prev, ...newBase64s]);
      showNotification(`Added ${newBase64s.length} production still(s)`);
    } catch {
      showNotification("Failed to process stills", "error");
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("SHORT FILM");
    setVideoType("youtube");
    setVideoUrl("");
    setDescription("");
    setCoverPhoto("");
    setCoverSizeKb(0);
    setScreenshots([]);
    setActiveScreenshotIdx(0);
  };

  const editProject = (p: CustomProject) => {
    setEditingId(p.id);
    setSelectedRole(p.role);
    setTitle(p.title);
    setCategory(p.category || "SHORT FILM");
    setVideoType(p.videoType || (p.videoUrl.includes("drive.google.com") ? "drive" : "youtube"));
    setVideoUrl(p.videoUrl || "");
    setDescription(p.description || "");
    setCoverPhoto(p.image || "");
    setScreenshots(p.screenshots || []);
    setActiveScreenshotIdx(0);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setSaving(true);
    const ok = await deleteCustomProject(id);
    if (ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showNotification("Project deleted successfully");
    } else {
      showNotification("Failed to delete project", "error");
    }
    setSaving(false);
  };

  // Validate form before preview / save
  const validateForm = () => {
    if (!title.trim()) {
      showNotification("Please provide a project name / title", "error");
      return false;
    }
    if (!videoUrl.trim()) {
      showNotification("Please provide a video link (YouTube or Google Drive)", "error");
      return false;
    }
    if (!coverPhoto) {
      showNotification("Please upload a cover landscape photo", "error");
      return false;
    }
    return true;
  };

  // Convert raw URL into embeddable URL
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    const driveMatch =
      rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      rawUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

    const ytMatch = rawUrl.match(
      /(youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,})/
    );
    if (ytMatch) {
      const id = ytMatch[2];
      return `https://www.youtube.com/embed/${id}`;
    }
    return rawUrl;
  };

  // Trigger preview modal
  const openSamplePage = (isDraft: boolean) => {
    if (!validateForm()) return;
    setPendingPublishStatus(isDraft);
    setIsPreviewOpen(true);
  };

  // Direct publish without opening preview modal
  const handleDirectPublish = async (isDraft: boolean) => {
    if (!validateForm()) return;
    setSaving(true);
    const now = Date.now();
    const roleObj = AVAILABLE_ROLES.find((r) => r.key === selectedRole);
    const roleTitle = roleObj ? roleObj.label.toUpperCase() : "DIRECTOR";

    const projectPayload: CustomProject = {
      id: editingId || `custom_${now}_${Math.random().toString(36).substring(2, 7)}`,
      role: selectedRole,
      roleTitle,
      title: title.trim(),
      category: category.trim() || "SHORT FILM",
      videoType,
      videoUrl: videoUrl.trim(),
      description: description.trim(),
      image: coverPhoto,
      screenshots,
      isDraft,
      createdAt: editingId ? (projects.find((p) => p.id === editingId)?.createdAt || now) : now,
      updatedAt: now,
    };

    const res = await saveSingleProject(projectPayload);

    if (res.success) {
      await loadProjects();
      setIsPreviewOpen(false);
      resetForm();
      showNotification(
        isDraft
          ? "Saved as Draft successfully!"
          : `Published successfully! Live under ${roleTitle}. View it under 'Managed Portfolio Projects' below.`
      );
    } else {
      showNotification(`Failed to save: ${res.error || "Unknown error"}`, "error");
    }
    setSaving(false);
  };

  // Publish a draft project directly from the list
  const publishDraftProject = async (p: CustomProject) => {
    setSaving(true);
    const res = await saveSingleProject({
      ...p,
      isDraft: false,
      updatedAt: Date.now(),
    });
    if (res.success) {
      await loadProjects();
      showNotification(`"${p.title}" is now LIVE under ${p.roleTitle}!`);
    } else {
      showNotification(`Failed to publish draft: ${res.error || "Unknown error"}`, "error");
    }
    setSaving(false);
  };

  // Final confirmation to commit publish / draft from sample preview modal
  const confirmSave = async () => {
    setSaving(true);
    const now = Date.now();
    const roleObj = AVAILABLE_ROLES.find((r) => r.key === selectedRole);
    const roleTitle = roleObj ? roleObj.label.toUpperCase() : "DIRECTOR";

    const projectPayload: CustomProject = {
      id: editingId || `custom_${now}_${Math.random().toString(36).substring(2, 7)}`,
      role: selectedRole,
      roleTitle,
      title: title.trim(),
      category: category.trim() || "SHORT FILM",
      videoType,
      videoUrl: videoUrl.trim(),
      description: description.trim(),
      image: coverPhoto,
      screenshots,
      isDraft: pendingPublishStatus,
      createdAt: editingId ? (projects.find((p) => p.id === editingId)?.createdAt || now) : now,
      updatedAt: now,
    };

    const res = await saveSingleProject(projectPayload);

    if (res.success) {
      await loadProjects();
      setIsPreviewOpen(false);
      resetForm();
      showNotification(
        pendingPublishStatus
          ? "Saved as Draft successfully!"
          : `Published successfully! Live under ${roleTitle}. View it in the list below.`
      );
    } else {
      showNotification(`Failed to save: ${res.error || "Unknown error"}`, "error");
    }
    setSaving(false);
  };

  // =========================================================================
  // 1. PIN Lock Screen
  // =========================================================================
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
                Admin Content Portal
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
              {verifying ? "Verifying..." : "Unlock Portal"}
            </button>
          </form>

          <p className="text-center text-[10px] text-neutral-600 font-mono mt-6">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  // Current project for sample page preview
  const currentRoleObj = AVAILABLE_ROLES.find((r) => r.key === selectedRole);
  const currentRoleTitle = currentRoleObj ? currentRoleObj.label.toUpperCase() : "DIRECTOR";

  return (
    <div className="min-h-screen bg-[#090909] text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white pb-24">
      {/* Top Navbar */}
      <header className="border-b border-neutral-800/80 bg-[#0f0f0f]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-light tracking-[0.25em] text-white">HRIDAY BAJAJ</h1>
            <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-neutral-700 bg-neutral-900 text-neutral-300 font-mono">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-neutral-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>

            <button
              onClick={handleLogout}
              className="p-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Lock Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-10">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-3.5 border ${
              notification.type === "error"
                ? "border-red-800 bg-red-950/60 text-red-200"
                : "border-emerald-800 bg-emerald-950/60 text-emerald-200"
            } text-xs font-mono flex items-center space-x-2.5 transition-all`}
          >
            {notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Section 1: Upload New Project Form */}
        <section className="border border-neutral-800 bg-[#111111] p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-white" />
                <h2 className="text-lg font-light tracking-[0.15em] text-white uppercase">
                  {editingId ? "Edit Project Page" : "Upload New Project Page"}
                </h2>
              </div>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Publish new work directly into Director, Writer, Editor, Gaffer, Producer, Sound, or Photography.
              </p>
            </div>

            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs font-mono text-neutral-400 hover:text-white border border-neutral-700 px-3 py-1.5 bg-neutral-900 cursor-pointer"
              >
                + Cancel Edit & Create New
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              openSamplePage(false);
            }}
            className="space-y-6"
          >
            {/* 1. Target Role & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Select Role / Section *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-700 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white transition-colors"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-neutral-500 font-mono mt-1">
                  Will appear on the {currentRoleTitle} page & automatically under &quot;MORE TO {currentRoleTitle}&quot;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Project Category / Genre
                </label>
                <input
                  type="text"
                  placeholder="e.g. SHORT FILM, DOCUMENTARY, TALK SHOW, MUSIC VIDEO"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-700 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white transition-colors uppercase font-mono text-xs"
                />
              </div>
            </div>

            {/* 2. Project Name / Title */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Project Name / Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Crumbs or Traces?, Trapped in Reverie, Amy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-700 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>

            {/* 3. Video Link (YouTube or Drive) */}
            <div className="border border-neutral-800/80 bg-[#141414] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Video Presentation Link *
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setVideoType("youtube")}
                    className={`px-3 py-1 text-xs font-mono flex items-center space-x-1.5 border ${
                      videoType === "youtube"
                        ? "border-red-600 bg-red-950/40 text-red-300"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>YouTube</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoType("drive")}
                    className={`px-3 py-1 text-xs font-mono flex items-center space-x-1.5 border ${
                      videoType === "drive"
                        ? "border-sky-600 bg-sky-950/40 text-sky-300"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                    <span>Google Drive</span>
                  </button>
                </div>
              </div>

              <input
                type="url"
                placeholder={
                  videoType === "youtube"
                    ? "https://www.youtube.com/watch?v=... or youtu.be/..."
                    : "https://drive.google.com/file/d/.../view?usp=sharing"
                }
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-700 text-white px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-white transition-colors"
                required
              />
              <p className="text-[10px] text-neutral-500 font-mono">
                {videoType === "youtube"
                  ? "Standard YouTube link or Short. Automatically converted into clean cinematic embed."
                  : "Google Drive sharing link (set to 'Anyone with the link can view'). Automatically converted into embed preview."}
              </p>
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Project Story & Description
              </label>
              <textarea
                rows={5}
                placeholder="Enter narrative, directorial concept, equipment, role overview. Use '-' dashes to separate paragraphs or key thoughts."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-700 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-white transition-colors leading-relaxed"
              />
              <p className="text-[10px] text-neutral-500 font-mono mt-1">
                Tip: Prefix lines with a dash (-) to format them into elegant structured paragraphs like the existing pages.
              </p>
            </div>

            {/* 5. Cover Photo (Long Landscape Photo) */}
            <div className="border border-neutral-800/80 bg-[#141414] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 block">
                      Cover Photo (Long Landscape Photo) *
                    </label>
                    {coverSizeKb > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 bg-emerald-950/50 border border-emerald-800">
                        {coverSizeKb} KB
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                    Used for the wide cinematic tile on the role listing and in &quot;MORE TO {currentRoleTitle}&quot;.
                  </p>
                </div>

                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="px-4 py-2 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-200 transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{coverPhoto ? "Replace Cover" : "Upload Cover Image"}</span>
                </button>
              </div>

              {coverPhoto ? (
                <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full bg-black overflow-hidden border border-neutral-800 group">
                  <img
                    src={coverPhoto}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPhoto("");
                        setCoverSizeKb(0);
                      }}
                      className="px-3 py-1.5 bg-red-900/80 border border-red-700 text-white text-xs font-mono flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 p-8 text-center cursor-pointer transition-colors bg-[#0f0f0f]"
                >
                  <ImageIcon className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs font-mono text-neutral-400">
                    Click to select landscape cover photo (PNG, JPG, WEBP)
                  </p>
                </div>
              )}
            </div>

            {/* 6. Production Screenshots (Carousel Slides) */}
            <div className="border border-neutral-800/80 bg-[#141414] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 block">
                    Production Screenshots ({screenshots.length})
                  </label>
                  <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                    Photos for the interactive carousel on the project page. You can upload multiple images.
                  </p>
                </div>

                <input
                  type="file"
                  ref={screenshotsInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotsUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => screenshotsInputRef.current?.click()}
                  className="px-4 py-2 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-200 transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Screenshots</span>
                </button>
              </div>

              {screenshots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {screenshots.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video bg-black border border-neutral-800 overflow-hidden group"
                    >
                      <img
                        src={src}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1 bg-black/70 text-[9px] font-mono text-neutral-300">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => screenshotsInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 p-6 text-center cursor-pointer transition-colors bg-[#0f0f0f]"
                >
                  <FolderOpen className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
                  <p className="text-xs font-mono text-neutral-500">
                    No screenshots added yet. Click to select on-set / film stills.
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Sample Preview, Save Draft, Publish */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-neutral-800 gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-mono text-neutral-400 hover:text-white"
              >
                Clear Form
              </button>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDirectPublish(true)}
                  disabled={saving}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => openSamplePage(false)}
                  disabled={saving}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Sample</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectPublish(false)}
                  disabled={saving}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono uppercase tracking-widest font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{saving ? "Publishing..." : "Publish Live Now"}</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Section 2: Manage Existing Custom Projects */}
        <section className="border border-neutral-800 bg-[#111111] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-lg font-light tracking-[0.15em] text-white uppercase">
                Managed Portfolio Projects ({projects.length})
              </h2>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                All pages added through this portal. Changes reflect instantly on hridaybajaj.com.
              </p>
            </div>
            <button
              onClick={loadProjects}
              className="p-2 border border-neutral-800 hover:border-neutral-600 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Reload list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              Loading portfolio pages...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              No custom projects created yet. Use the form above to add your first project!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="border border-neutral-800 bg-[#161616] p-4 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex space-x-4">
                    <div className="w-24 h-16 bg-black border border-neutral-800 shrink-0 overflow-hidden">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 font-mono">
                          No Cover
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300">
                          {p.roleTitle}
                        </span>
                        {p.isDraft ? (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-300">
                            Draft
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                            Live
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-white truncate mt-1">
                        {p.title}
                      </h3>
                      <p className="text-[11px] font-mono text-neutral-400 truncate">
                        {p.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs font-mono">
                    <span className="text-neutral-500 text-[10px]">
                      {p.screenshots?.length || 0} stills
                    </span>

                    <div className="flex items-center space-x-2">
                      {p.isDraft ? (
                        <button
                          onClick={() => publishDraftProject(p)}
                          className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-700 hover:border-emerald-500 text-emerald-300 transition-colors cursor-pointer text-[11px]"
                        >
                          Publish Live
                        </button>
                      ) : (
                        <a
                          href={`/?role=${p.role}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors flex items-center space-x-1 text-[11px]"
                        >
                          <span>View Live</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                      <button
                        onClick={() => editProject(p)}
                        className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 transition-colors cursor-pointer text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* =========================================================================
          3. Sample Page & Publication Confirmation Modal
          ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto">
          {/* Sticky confirmation banner at top of Sample Page */}
          <div className="sticky top-0 z-50 bg-[#161616] border-b border-neutral-700 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-mono text-white font-medium">
                  SAMPLE PAGE PREVIEW — {title.toUpperCase()}
                </p>
                <p className="text-[10px] text-neutral-400 font-mono">
                  This simulates the exact live page under{" "}
                  <strong className="text-neutral-200">{currentRoleTitle}</strong> with automatic
                  embed and &quot;MORE TO {currentRoleTitle}&quot;.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex-1 sm:flex-initial px-4 py-2 border border-neutral-700 bg-neutral-900 text-neutral-300 text-xs font-mono hover:text-white cursor-pointer"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={confirmSave}
                disabled={saving}
                className="flex-1 sm:flex-initial px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {saving
                    ? "Publishing..."
                    : pendingPublishStatus
                    ? "Confirm Save as Draft"
                    : "Confirm & Publish Live"}
                </span>
              </button>
            </div>
          </div>

          {/* Render Actual Sample Page exactly as it appears to visitors */}
          <div className="min-h-screen bg-background text-black pb-24 font-sans">
            <header className="py-6 px-6 border-b border-gray-100 bg-white">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-light tracking-[0.2em] text-black">
                    HRIDAY BAJAJ
                  </h1>
                  <p className="text-xs text-gray-600 tracking-[0.15em] mt-1 pl-[2px]">
                    FILMMAKER
                  </p>
                </div>
                <div className="text-xs font-mono tracking-wider text-gray-500 uppercase">
                  {currentRoleTitle}
                </div>
              </div>
            </header>

            <div className="pt-12 pb-16">
              <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                  {/* Embedded Player */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                    <iframe
                      src={getEmbedUrl(videoUrl)}
                      className="w-full h-full"
                      title={`${title} preview`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>

                  {/* Title & Structured Description */}
                  <div className="space-y-4">
                    <div className="text-xs font-mono tracking-widest text-gray-500 uppercase">
                      {category}
                    </div>
                    <h2 className="text-3xl font-light tracking-wider text-black">
                      {title}
                    </h2>
                    <div className="text-sm leading-relaxed text-gray-700 space-y-3 font-normal">
                      {description
                        ? description
                            .split("-")
                            .map((line: string, index: number) =>
                              line.trim() ? <p key={index}>{line.trim()}</p> : null
                            )
                        : (
                          <p className="text-gray-400 italic">No description entered.</p>
                        )}
                    </div>
                  </div>

                  {/* Screenshot Carousel */}
                  {screenshots.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-light tracking-wider text-black">
                        PRODUCTION STILLS ({screenshots.length})
                      </h3>
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group shadow-lg">
                        <img
                          src={screenshots[activeScreenshotIdx] || screenshots[0]}
                          alt="Production Still"
                          className="w-full h-full object-cover"
                        />

                        {screenshots.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScreenshotIdx(
                                  (prev) => (prev - 1 + screenshots.length) % screenshots.length
                                )
                              }
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-20 cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScreenshotIdx((prev) => (prev + 1) % screenshots.length)
                              }
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-20 cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MORE TO {ROLE} Automatic Section */}
                  <div className="space-y-6 pt-8 border-t border-gray-200">
                    <h3 className="text-xl font-light tracking-wider text-black">
                      MORE TO {currentRoleTitle}
                    </h3>

                    <div className="space-y-0">
                      <div className="relative h-[30vh] bg-gray-100 overflow-hidden group cursor-pointer tile-hover">
                        <img
                          src={coverPhoto || "/placeholder.svg"}
                          alt={title}
                          className="w-full h-full object-cover tile-image"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <div className="text-center text-white tile-text">
                            <div className="text-xs tracking-wider mb-2">{category}</div>
                            <div className="text-2xl md:text-3xl font-light tracking-wider">
                              {title} (Cover Preview)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
