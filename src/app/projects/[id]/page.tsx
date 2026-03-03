"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import StepProgress from "@/components/StepProgress";
import SubtitleEditor from "@/components/SubtitleEditor";
import { Project } from "@/lib/types";
import { Download, Volume2, FileText, Film, AlertCircle, RefreshCw, Loader2, XCircle } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [project, setProject]   = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"watch" | "subtitles" | "export">("subtitles");
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  /* ── REST fetch (initial load and polling fallback) ── */
  const fetchProject = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (data.status === "completed" && activeTab === "subtitles") setActiveTab("watch");
      }
    } catch (err) {
      console.error("Layihə yüklənə bilmədi:", err);
    }
  }, [id, getToken]);

  /* ── SSE connection ── */
  const connectSSE = useCallback(async () => {
    if (eventSourceRef.current) { eventSourceRef.current.close(); }

    const token = await getToken();
    const url = `${API}/api/projects/${id}/events`;

    // EventSource doesn't support custom headers — we'll send token as query param
    // Backend must read it from ?token= query if Authorization header isn't available
    // Alternatively: poll the REST endpoint alongside SSE
    const es = new EventSource(`${url}?token=${token}`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress({ percent: data.percent, message: data.message });
        if (data.step === "completed") {
          fetchProject();
          es.close();
        }
        if (data.step === "failed" || data.step === "cancelled") {
          fetchProject();
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [id, getToken]);

  /* ── Initial load + polling (every 4s as SSE fallback) ── */
  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 4000);
    return () => clearInterval(interval);
  }, [fetchProject]);

  /* ── Connect SSE when project is processing ── */
  useEffect(() => {
    if (!project) return;
    const isProcessing = !["completed", "failed", "cancelled"].includes(project.status);
    if (isProcessing) {
      connectSSE();
    } else {
      eventSourceRef.current?.close();
    }
    return () => eventSourceRef.current?.close();
  }, [project?.status]);

  /* ── Actions ── */
  const startPipeline = async () => {
    if (!project) return;
    setIsStarting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });
      if (res.ok) { toast.success("Pipeline başladıldı"); connectSSE(); }
      else toast.error("Pipeline başladıla bilmədi");
    } finally { setIsStarting(false); }
  };

  const cancelPipeline = async () => {
    if (!project) return;
    setIsCancelling(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/projects/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Proses ləğv edildi"); fetchProject(); }
      else toast.error("Ləğv edilə bilmədi");
    } finally { setIsCancelling(false); }
  };

  const isProcessing = project ? !["completed", "failed", "cancelled"].includes(project.status) : false;

  const statusMsg: Record<string, string> = {
    uploading: "Video hazırlanır...",
    transcribing: "Transkripsiya edilir...",
    translating: "Tərcümə edilir...",
    dubbing: "Dublaj yaradılır...",
    completed: "Tamamlandı! 🎉",
    failed: "Xəta baş verdi",
    cancelled: "Ləğv edildi",
  };

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-10 animate-spin text-violet-500" />
            <p className="font-medium text-muted-foreground">Yüklənir...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container max-w-3xl flex-1 pb-16 pt-28 px-4 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.sourceLanguage?.toUpperCase()} → {project.targetLanguage?.toUpperCase()}
            {project.createdAt && ` · ${formatDate(project.createdAt)}`}
          </p>
        </div>

        {/* Step Progress */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 mb-6">
          <StepProgress status={project.status} />

          {/* Live progress bar */}
          {isProcessing && progress && (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-medium text-violet-400 animate-pulse">{progress.message}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {isProcessing && !progress && (
            <p className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
              ⚡ {statusMsg[project.status] || project.status}
            </p>
          )}

          {project.status === "completed" && (
            <p className="mt-4 text-center text-sm font-semibold text-emerald-500">✅ {statusMsg.completed}</p>
          )}

          {project.status === "cancelled" && (
            <p className="mt-4 text-center text-sm font-medium text-muted-foreground">🚫 {statusMsg.cancelled}</p>
          )}

          {project.status === "failed" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {project.error || "Xəta baş verdi. Yenidən cəhd edin."}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 flex justify-center gap-3">
            {project.status === "uploading" && !isProcessing && (
              <Button onClick={startPipeline} disabled={isStarting} className="bg-violet-600 hover:bg-violet-700 rounded-xl">
                {isStarting ? <><Loader2 className="size-4 animate-spin mr-2" /> Başladılır...</> : <><RefreshCw className="size-4 mr-2" /> Pipeline Başlat</>}
              </Button>
            )}
            {isProcessing && (
              <Button variant="outline" onClick={cancelPipeline} disabled={isCancelling} className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                {isCancelling ? <><Loader2 className="size-4 animate-spin mr-2" /> Ləğv edilir...</> : <><XCircle className="size-4 mr-2" /> Ləğv et</>}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {(project.status === "completed" || (project.subtitles?.length ?? 0) > 0) && (
          <>
            <div className="flex gap-1 rounded-xl bg-muted p-1 mb-5">
              {[
                { id: "watch", label: "İzlə", icon: Film, hide: project.status !== "completed" },
                { id: "subtitles", label: "Subtitrler", icon: FileText },
                { id: "export", label: "Yüklə", icon: Download },
              ].map((tab) => {
                if (tab.hide) return null;
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                      activeTab === tab.id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}>
                    <Icon className="size-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "watch" && project.status === "completed" && (
              <div className="rounded-2xl overflow-hidden border bg-black aspect-video">
                <video controls className="h-full w-full" src={`${API}/api/video/${id}`} />
              </div>
            )}

            {activeTab === "subtitles" && (
              <SubtitleEditor subtitles={project.subtitles || []} />
            )}

            {activeTab === "export" && (
              <div className="space-y-3">
                {[
                  { icon: <Film className="size-5 text-violet-500" />, label: "Dublajlı Video", desc: "MP4 formatı", format: "mp4", ok: project.status === "completed" },
                  { icon: <FileText className="size-5 text-blue-500" />, label: "Subtitrler", desc: "SRT formatı", format: "srt", ok: !!(project.subtitles?.some(s => s.translatedText)) },
                  { icon: <Volume2 className="size-5 text-emerald-500" />, label: "Yalnız Səs", desc: "MP3 audio", format: "audio", ok: project.status === "completed" },
                ].map((item) => (
                  <div key={item.format} className={cn("flex items-center gap-4 p-5 rounded-2xl border bg-card", !item.ok && "opacity-40")}>
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">{item.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    {item.ok ? (
                      <Button size="sm" variant="secondary" className="rounded-xl gap-1.5" asChild>
                        <a href={`${API}/api/export?projectId=${id}&format=${item.format}`}><Download className="size-3.5" /> Yüklə</a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" className="rounded-xl gap-1.5" disabled><Download className="size-3.5" /> Yüklə</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
