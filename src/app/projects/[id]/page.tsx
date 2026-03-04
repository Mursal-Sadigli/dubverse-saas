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
import { API } from "@/lib/constants";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [project, setProject]   = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"watch" | "subtitles" | "export">("subtitles");
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [speakerVoices, setSpeakerVoices] = useState<Record<string, string>>({});
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

  /* ── Initial load + polling ── */
  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 5000);

    // Fetch available voices
    const fetchVoices = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/api/voices`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setVoices(data.voices || []);
        }
      } catch (err) { console.error("Səslər yüklənmədi", err); }
    };
    fetchVoices();

    return () => clearInterval(interval);
  }, [fetchProject, getToken]);

  /* ── Sync local speaker voices from project ── */
  useEffect(() => {
    if (project?.voiceSettings) {
      try {
        const parsed = typeof project.voiceSettings === 'string' ? JSON.parse(project.voiceSettings) : project.voiceSettings;
        setSpeakerVoices(parsed);
      } catch { setSpeakerVoices({}); }
    }
  }, [project?.voiceSettings]);

  /* ── Auto-assign voices based on gender hints ── */
  useEffect(() => {
    if (!project?.subtitles || voices.length === 0 || project.status !== 'uploading') return;
    
    // Only run if we don't have settings yet or they are very sparse
    const currentCount = Object.keys(speakerVoices).length;
    const speakerIds = Array.from(new Set(project.subtitles.map(s => s.speaker_id || 1)));
    
    if (currentCount < speakerIds.length) {
      const newSettings = { ...speakerVoices };
      let changed = false;

      speakerIds.forEach(sid => {
        if (!newSettings[sid]) {
          const firstSub = project.subtitles.find(s => (s.speaker_id || 1) === sid);
          if (firstSub?.speaker_gender === 'male') {
            newSettings[sid] = "2EiwWnXFnvU5JabPnv8n"; // Clyde
            changed = true;
          } else if (firstSub?.speaker_gender === 'female') {
            newSettings[sid] = "21m00Tcm4TlvDq8ikWAM"; // Rachel
            changed = true;
          }
        }
      });

      if (changed) {
        setSpeakerVoices(newSettings);
        // Persist to DB automatically
        saveVoiceSettings(null as any, null as any, newSettings);
      }
    }
  }, [project?.subtitles, voices, project?.status]);

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
    } catch { toast.error("Şəbəkə xətası"); }
    finally { setIsStarting(false); }
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
    } catch { toast.error("Xəta baş verdi"); }
    finally { setIsCancelling(false); }
  };

  const saveVoiceSettings = async (idOfSpeaker?: string | null, vId?: string | null, bulkSettings?: any) => {
    const newSettings = bulkSettings || { ...speakerVoices, [idOfSpeaker as string]: vId };
    setSpeakerVoices(newSettings);
    try {
      const token = await getToken();
      await fetch(`${API}/api/projects/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ voiceSettings: newSettings }),
      });
      if (!bulkSettings) toast.success("Səslər yeniləndi");
    } catch { toast.error("Ayarlar saxlanmadı"); }
  };

  const downloadSRT = async () => {
    if (!project) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/video/${id}/srt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subtitles_${id}.srt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("SRT endirilir...");
      } else {
        toast.error("SRT endirilə bilmədi");
      }
    } catch {
      toast.error("Şəbəkə xətası");
    }
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.sourceLanguage?.toUpperCase()} → {project.targetLanguage?.toUpperCase()}
              {project.createdAt && ` · ${formatDate(project.createdAt)}`}
            </p>
          </div>
          
          {(project.subtitles?.length || 0) > 0 && (
            <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSRT}
                className="rounded-xl border-violet-500/30 text-violet-400 hover:bg-violet-500/10 self-start"
            >
              <Download className="size-4 mr-2" />
              SRT Endir
            </Button>
          )}
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
            {(project.status === "uploading" || project.status === "failed") && (
              <Button onClick={startPipeline} disabled={isStarting || isProcessing} className="bg-violet-600 hover:bg-violet-700 rounded-xl">
                {isStarting ? <><Loader2 className="size-4 animate-spin mr-2" /> Başladılır...</> : <><RefreshCw className="size-4 mr-2" /> {project.status === "failed" ? "Yenidən Cəhd" : "Dublajı Başlat"}</>}
              </Button>
            )}
            {isProcessing && (
              <Button variant="outline" onClick={cancelPipeline} disabled={isCancelling} className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                {isCancelling ? <><Loader2 className="size-4 animate-spin mr-2" /> Ləğv edilir...</> : <><XCircle className="size-4 mr-2" /> Ləğv et</>}
              </Button>
            )}
          </div>
        </div>

        {((project.subtitles?.length || 0) > 0) && (
          <div className="mb-6 rounded-2xl border bg-card p-6">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Volume2 className="size-4 text-violet-500" /> Spiker Səsləri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from(new Set(project.subtitles.map(s => s.speaker_id || 1))).sort().map(sid => {
                const firstSub = project.subtitles.find(s => (s.speaker_id || 1) === sid);
                const gender = firstSub?.speaker_gender;
                const preview = firstSub?.text ? (firstSub.text.substring(0, 45) + "...") : "";
                
                return (
                  <div key={sid} className="space-y-1.5 p-3 rounded-xl border bg-muted/20">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Spiker {sid}</span>
                        {gender && (
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border",
                            gender === 'male' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-pink-500/10 text-pink-500 border-pink-500/20"
                          )}>
                            {gender === 'male' ? "Kişi" : "Qadın"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-violet-400 font-medium tracking-tight">ElevenLabs</span>
                    </div>
                    
                    {preview && (
                      <p className="px-1 text-[10px] text-muted-foreground italic line-clamp-1 mb-1" title={firstSub?.text}>
                        "{preview}"
                      </p>
                    )}

                    <select 
                      className="w-full bg-background border rounded-lg h-9 px-2 text-xs font-medium outline-none focus:ring-1 focus:ring-violet-500"
                      value={speakerVoices[sid] || project.voiceId || ""}
                      onChange={(e) => saveVoiceSettings(String(sid), e.target.value)}
                    >
                      <option value="">Səs seçin...</option>
                      {voices.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender || "neutral"})</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground italic">
              * Hər bir spiker üçün fərqli səs seçə bilərsiniz. Seçdiyiniz səslər avtomatik yadda saxlanılır.
            </p>
          </div>
        )}

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
