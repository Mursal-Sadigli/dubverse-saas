"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeft, Sparkles, Wand2, CheckCircle2, Mic2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import UploadZone from "@/components/UploadZone";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API } from "@/lib/constants";

interface Voice { id: string; name: string; category: string; gender: string | null; previewUrl: string | null }

export default function NewDubPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState("az");
  const [projectName, setProjectName] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("21m00Tcm4TlvDq8ikWAM"); // Rachel default
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/api/voices`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const filtered = (data.voices || []).filter((v: Voice) => v.category !== "cloned").slice(0, 20);
        setVoices(filtered);
      } catch { /* non fatal */ }
      finally { setLoadingVoices(false); }
    })();
  }, []);

  const playPreview = (url: string | null) => {
    if (!url) return;
    if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0; }
    const audio = new Audio(url);
    audio.play();
    setPreviewAudio(audio);
  };

  const handleUpload = async (data: { file?: File; youtubeUrl?: string }) => {
    if (!projectName.trim()) { toast.warning("Əvvəlcə layihənin adını daxil edin."); return; }
    setIsLoading(true);
    const toastId = toast.loading("Layihə yaradılır...");
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", projectName);
      formData.append("sourceLanguage", sourceLang);
      formData.append("targetLanguage", targetLang);
      formData.append("voiceId", selectedVoiceId);
      if (data.file) formData.append("file", data.file);
      if (data.youtubeUrl) formData.append("youtubeUrl", data.youtubeUrl);

      const uploadRes = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadResult = await uploadRes.json();
      if (!uploadResult.projectId) throw new Error(uploadResult.error || "Layihə yaradıla bilmədi");

      await fetch(`${API}/api/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: uploadResult.projectId }),
      });

      toast.success("Layihə yaradıldı! Yönləndirilir...", { id: toastId });
      router.push(`/projects/${uploadResult.projectId}`);
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4 mr-1" /> Geri
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="size-6 text-violet-500" /> Yeni Dublaj
        </h1>
        <p className="text-sm text-muted-foreground">Fayl yükləyin və ya YouTube linki yapışdırın.</p>
      </div>

      <div className="space-y-5">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Layihə adı</label>
          <Input placeholder="Mənim Videom" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="h-11 rounded-xl" />
          {projectName.trim() && (
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 className="size-3" /> Əla!</p>
          )}
        </div>

        {/* Languages */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Mənbə dili", value: sourceLang, set: setSourceLang, filter: undefined },
            { label: "Hədəf dili", value: targetLang, set: setTargetLang, filter: sourceLang },
          ].map((sel) => (
            <div key={sel.label} className="space-y-2">
              <label className="text-sm font-semibold">{sel.label}</label>
              <select className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium outline-none cursor-pointer focus:ring-2 focus:ring-violet-500/50"
                value={sel.value} onChange={(e) => sel.set(e.target.value)}>
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== sel.filter).map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold flex items-center gap-2"><Mic2 className="size-4 text-violet-500" /> Səs seçimi</label>
            <Badge variant="outline" className="text-[10px]">ElevenLabs</Badge>
          </div>
          {loadingVoices ? (
            <div className="h-11 flex items-center gap-2 px-3 rounded-xl border text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Səslər yüklənir...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {voices.map((v) => (
                <button key={v.id} type="button"
                  onClick={() => setSelectedVoiceId(v.id)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                    selectedVoiceId === v.id
                      ? "border-violet-500 bg-violet-500/10 text-violet-400"
                      : "border-border hover:border-violet-500/40 hover:bg-violet-500/5"
                  )}>
                  <span className="text-xs font-semibold leading-tight">{v.name}</span>
                  <span className="text-[10px] text-muted-foreground">{v.gender || v.category}</span>
                  {v.previewUrl && (
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); playPreview(v.previewUrl); }}
                      className="mt-1 text-[10px] text-violet-400 hover:text-violet-300 underline underline-offset-2 cursor-pointer">
                      ▶ Dinlə
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Media */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Media</label>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Maks 100MB / 10 dəq</Badge>
          </div>
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />
        </div>

        {!projectName.trim() && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3.5 flex gap-2.5 items-center border border-amber-200 dark:border-amber-500/20">
            <Wand2 className="size-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Media yükləmədən əvvəl layihənin adını daxil edin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
