"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import StepProgress from "@/components/StepProgress";
import { Project } from "@/lib/types";
import { Download, Volume2, FileText, Film, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"watch" | "subtitles" | "export">("subtitles");
  const [isStarting, setIsStarting] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error("Layihə yüklənə bilmədi:", err);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 3000);
    return () => clearInterval(interval);
  }, [fetchProject]);

  // Auto-switch to "watch" when completed
  useEffect(() => {
    if (project?.status === "completed" && activeTab === "subtitles") {
      setActiveTab("watch");
    }
  }, [project?.status]);

  const startPipeline = async () => {
    if (!project) return;
    setIsStarting(true);
    try {
      const token = await getToken();
      await fetch(`${API}/api/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });
    } finally {
      setIsStarting(false);
    }
  };

  const isProcessing = project ? !["completed", "failed"].includes(project.status) : false;

  const statusLabel: Record<string, string> = {
    uploading: "Video hazırlanır...",
    transcribing: "Transkripsiya edilir...",
    translating: "Tərcümə edilir...",
    dubbing: "Dublaj səs yaradılır...",
    completed: "Tamamlandı!",
    failed: "Xəta baş verdi",
  };

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-10 animate-spin text-violet-500" />
            <p className="font-medium text-muted-foreground">Layihə məlumatları yüklənir...</p>
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
            {project.sourceLanguage?.toUpperCase()} → {project.targetLanguage?.toUpperCase()} · {project.createdAt && formatDate(project.createdAt)}
          </p>
        </div>

        {/* Step Progress Card */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 mb-6">
          <StepProgress status={project.status} />

          <div className="mt-5 text-center">
            {isProcessing && (
              <p className="text-sm font-medium text-violet-400 animate-pulse">
                ⚡ {statusLabel[project.status] || project.status}
              </p>
            )}
            {project.status === "completed" && (
              <p className="text-sm font-semibold text-emerald-500">✅ Dublaj uğurla tamamlandı!</p>
            )}
            {project.status === "failed" && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {project.error || "Xəta baş verdi. Yenidən cəhd edin."}
              </div>
            )}
            {project.status === "uploading" && !isProcessing && (
              <Button onClick={startPipeline} disabled={isStarting} className="mt-4 bg-violet-600 hover:bg-violet-700 rounded-xl">
                {isStarting ? <><Loader2 className="size-4 animate-spin mr-2" /> Başladılır...</> : <><RefreshCw className="size-4 mr-2" /> AI Pipeline Başlat</>}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs — show once there's something to see */}
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
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                      activeTab === tab.id
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Watch */}
            {activeTab === "watch" && project.status === "completed" && (
              <div className="rounded-2xl overflow-hidden border bg-black aspect-video">
                <video controls className="h-full w-full" src={`${API}/api/video/${id}`} />
              </div>
            )}

            {/* Subtitles */}
            {activeTab === "subtitles" && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b font-semibold text-sm">
                  Subtitrler ({project.subtitles?.length || 0})
                </div>
                <div className="max-h-[480px] overflow-y-auto divide-y divide-border">
                  {project.subtitles?.length ? project.subtitles.map((sub) => (
                    <div key={sub.id} className="grid sm:grid-cols-[100px_1fr_1fr] gap-3 p-4 text-sm">
                      <span className="font-mono text-[11px] text-muted-foreground pt-0.5">
                        {Math.floor(sub.start / 60)}:{String(Math.floor(sub.start % 60)).padStart(2, "0")} → {Math.floor(sub.end / 60)}:{String(Math.floor(sub.end % 60)).padStart(2, "0")}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{sub.text}</p>
                      <p className="text-violet-400 leading-relaxed">{sub.translatedText || "—"}</p>
                    </div>
                  )) : (
                    <p className="p-8 text-center text-sm text-muted-foreground">Transkripsiyadan sonra burda görünəcək.</p>
                  )}
                </div>
              </div>
            )}

            {/* Export */}
            {activeTab === "export" && (
              <div className="space-y-3">
                {[
                  { icon: <Film className="size-5 text-violet-500" />, label: "Dublajlı Video", desc: "MP4 formatında yüklə", format: "mp4", ok: project.status === "completed" },
                  { icon: <FileText className="size-5 text-blue-500" />, label: "Subtitrler", desc: "SRT formatında yüklə", format: "srt", ok: !!(project.subtitles?.some(s => s.translatedText)) },
                  { icon: <Volume2 className="size-5 text-emerald-500" />, label: "Yalnız Səs", desc: "MP3 audio yüklə", format: "audio", ok: project.status === "completed" },
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
                      <Button size="sm" variant="secondary" className="rounded-xl gap-1.5" disabled>
                        <Download className="size-3.5" /> Yüklə
                      </Button>
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
