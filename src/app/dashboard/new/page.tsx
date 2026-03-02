"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles, Wand2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import UploadZone from "@/components/UploadZone";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewDubPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState("az");
  const [projectName, setProjectName] = useState("");
  const [sourceLang, setSourceLang] = useState("en");

  const handleUpload = async (data: { file?: File; youtubeUrl?: string }) => {
    if (!projectName.trim()) {
      toast.warning("Zəhmət olmasa əvvəlcə layihənin adını daxil edin.");
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading("Dublaj pipeline başladılır...");
    try {
      const formData = new FormData();
      formData.append("name", projectName);
      formData.append("sourceLanguage", sourceLang);
      formData.append("targetLanguage", targetLang);
      if (data.file) formData.append("file", data.file);
      if (data.youtubeUrl) formData.append("youtubeUrl", data.youtubeUrl);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.projectId) {
        toast.success("Layihə yaradıldı! Yönləndirilir...", { id: toastId });
        router.push(`/projects/${result.projectId}`);
      } else {
        throw new Error(result.error || "Layihə yaradıla bilmədi");
      }
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.back()}
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4 mr-1" /> Geri
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="size-6 text-violet-500" />
          Yeni Dublaj
        </h1>
        <p className="text-sm text-muted-foreground">Fayl yükləyin və ya YouTube linki yapışdırın.</p>
      </div>

      <div className="space-y-5">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Layihə adı</label>
          <Input
            placeholder="Mənim Videom"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="h-11 rounded-xl"
          />
          {projectName.trim() && (
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Əla!
            </p>
          )}
        </div>

        {/* Language selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Mənbə dili</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium outline-none cursor-pointer focus:ring-2 focus:ring-violet-500/50"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Hədəf dili</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium outline-none cursor-pointer focus:ring-2 focus:ring-violet-500/50"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.filter(l => l.code !== sourceLang).map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Separator />

        {/* Media upload */}
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
