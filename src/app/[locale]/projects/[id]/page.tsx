"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import StepProgress from "@/components/StepProgress";
import { Project } from "@/lib/types";
import { Download, Volume2, FileText, Film, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { getStatusLabel, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProjectPage() {
  const t = useTranslations("projects");
  const common = useTranslations("common");
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"watch" | "subtitles" | "export">("subtitles");
  const [isStarting, setIsStarting] = useState(false);

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (data.status === "completed" && activeTab !== "export" && activeTab !== "subtitles") {
            setActiveTab("watch");
        }
    }
  };

  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (project?.status === "completed" && activeTab === "subtitles") {
        setActiveTab("watch");
    }
  }, [project?.status]);

  const startPipeline = async () => {
    if (!project) return;
    setIsStarting(true);
    try {
      await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id }) });
    } finally {
      setIsStarting(false);
    }
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin text-violet-500" />
          <p className="font-medium text-muted-foreground">{common("loading")}</p>
        </div>
      </div>
    );
  }

  const isProcessing = !["completed", "failed"].includes(project.status);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container max-w-4xl pb-16 pt-32">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <span className="whitespace-nowrap text-[13px] text-muted-foreground">{formatDate(project.createdAt)}</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {project.sourceLanguage} → {project.targetLanguage}
          </p>
        </div>

        {/* Step progress */}
        <Card className="glass mb-8 p-6 sm:p-8">
          <StepProgress status={project.status} />
          {isProcessing && (
            <p className="mt-5 text-center text-sm font-medium text-muted-foreground animate-pulse">
              ⚡ {getStatusLabel(project.status)} — this may take a few minutes...
            </p>
          )}
          {project.status === "uploading" && (
            <div className="mt-6 text-center">
              <Button onClick={startPipeline} disabled={isStarting} variant="premium">
                {isStarting ? (
                  <><Loader2 className="size-4 animate-spin" /> Starting pipeline...</>
                ) : (
                  <><RefreshCw className="size-4" /> Start AI Pipeline</>
                )}
              </Button>
            </div>
          )}
          {project.status === "failed" && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm font-medium text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {project.error || "Something went wrong. Please try again."}
            </div>
          )}
        </Card>

        {/* Tabs (only when completed or has subtitles) */}
        {(project.status === "completed" || project.subtitles?.length > 0) && (
          <>
            {/* Tab bar */}
            <div className="mb-5 flex gap-1 rounded-xl bg-foreground/5 p-1">
              {(["watch", "subtitles", "export"] as const).map((tab) => {
                if (tab === "watch" && project.status !== "completed") return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                      activeTab === tab
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    {tab === "watch" ? <Film className="size-4" /> : tab === "subtitles" ? <FileText className="size-4" /> : <Download className="size-4" />}
                    {t(`tabs.${tab}`)}
                  </button>
                );
              })}
            </div>

            {/* Watch tab */}
            {activeTab === "watch" && project.status === "completed" && (
              <Card className="glass overflow-hidden p-0 mb-8 aspect-video flex items-center justify-center bg-black/40">
                <video 
                  controls 
                  className="h-full w-full object-contain"
                  src={`/api/projects/${id}/video`}
                >
                  Your browser does not support the video tag.
                </video>
              </Card>
            )}

            {/* Subtitles tab */}
            {activeTab === "subtitles" && (
              <Card className="glass overflow-hidden">
                <div className="border-b border-foreground/5 px-5 py-4">
                  <span className="font-semibold text-foreground">Subtitles ({project.subtitles?.length || 0})</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {project.subtitles?.map((sub) => (
                    <div key={sub.id} className="grid grid-cols-1 gap-2 border-b border-foreground/5 p-5 text-sm sm:grid-cols-[auto_1fr_1fr] sm:gap-6">
                      <span className="min-w-[90px] font-mono text-[11px] text-muted-foreground">
                        {Math.floor(sub.start / 60)}:{String(Math.floor(sub.start % 60)).padStart(2, "0")} →{" "}
                        {Math.floor(sub.end / 60)}:{String(Math.floor(sub.end % 60)).padStart(2, "0")}
                      </span>
                      <p className="leading-relaxed text-muted-foreground">{sub.text}</p>
                      <p className="leading-relaxed text-violet-300">{sub.translatedText || "—"}</p>
                    </div>
                  ))}
                  {(!project.subtitles || project.subtitles.length === 0) && (
                    <p className="p-8 text-center text-muted-foreground">Subtitles will appear here after transcription.</p>
                  )}
                </div>
              </Card>
            )}

            {/* Export tab */}
            {activeTab === "export" && (
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Film className="size-5 text-violet-500" />, label: "Dubbed Video", desc: "MP4 with AI voice track", format: "mp4", disabled: project.status !== "completed" },
                  { icon: <FileText className="size-5 text-blue-500" />, label: "Subtitles", desc: "SRT subtitle file", format: "srt", disabled: !project.subtitles?.some(s => s.translatedText) },
                  { icon: <Volume2 className="size-5 text-emerald-500" />, label: "Audio Only", desc: "MP3 dubbed audio track", format: "audio", disabled: project.status !== "completed" },
                ].map((item) => (
                  <Card key={item.format} className={cn("glass flex items-center gap-4 p-5", item.disabled && "opacity-50 grayscale")}>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground/5">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 font-semibold text-foreground">{item.label}</p>
                      <p className="text-[13px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={cn("gap-1.5", item.disabled && "pointer-events-none")}
                      asChild={!item.disabled}
                    >
                      {item.disabled ? (
                        <span><Download className="size-3.5" /> Download</span>
                      ) : (
                        <a href={`/api/export?projectId=${id}&format=${item.format}`}>
                          <Download className="size-3.5" /> Download
                        </a>
                      )}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
