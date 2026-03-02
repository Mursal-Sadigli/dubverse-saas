"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import UploadZone from "@/components/UploadZone";
import { SUPPORTED_LANGUAGES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewDubPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState("az");
  const [projectName, setProjectName] = useState("");
  const [sourceLang, setSourceLang] = useState("en");

  const handleUpload = async (data: { file?: File; youtubeUrl?: string }) => {
    if (!projectName.trim()) return;
    setIsLoading(true);
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
        router.push(`/projects/${result.projectId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.back()}
        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4 mr-1" /> Back
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <Sparkles className="size-6 text-violet-500" />
          </div>
          New Dub
        </h1>
        <p className="text-muted-foreground">Create a new dubbing project by uploading a file or pasting a YouTube link.</p>
      </div>

      <Card className="glass border-none shadow-xl overflow-hidden rounded-4xl">
        <CardHeader className="pb-8 border-b border-zinc-500/5">
          <CardTitle className="text-xl">Project Details</CardTitle>
          <CardDescription>Configure your translation and voice settings.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">Project Name</label>
              <Input
                placeholder="My Awesome Video"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-12 text-lg rounded-2xl bg-zinc-500/5 border-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Source Language</label>
                <select
                  className="flex h-12 w-full rounded-2xl border-none bg-zinc-500/5 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none cursor-pointer"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Target Language</label>
                <select
                  className="flex h-12 w-full rounded-2xl border-none bg-zinc-500/5 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-violet-500/50 outline-none cursor-pointer"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  {SUPPORTED_LANGUAGES.filter(l => l.code !== sourceLang).map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
             <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold">Media Content</label>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider backdrop-blur-sm">Max 100MB / 10 min</Badge>
             </div>
             <UploadZone onUpload={handleUpload} isLoading={isLoading} />
          </div>

          {!projectName.trim() && (
            <div className="rounded-2xl bg-amber-500/10 p-4 flex gap-3 items-center border border-amber-500/20">
               <div className="p-1.5 rounded-full bg-amber-500/20">
                  <Wand2 className="size-4 text-amber-500" />
               </div>
               <p className="text-xs text-amber-200/80 font-medium">Please enter a project name before uploading media.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center">
         <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
         </p>
      </div>
    </div>
  );
}
