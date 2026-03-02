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
  const [sourceLangSearch, setSourceLangSearch] = useState("");
  const [targetLangSearch, setTargetLangSearch] = useState("");

  const filteredSourceLangs = SUPPORTED_LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(sourceLangSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(sourceLangSearch.toLowerCase())
  );
  const filteredTargetLangs = SUPPORTED_LANGUAGES.filter(l =>
    l.code !== sourceLang && (
      l.label.toLowerCase().includes(targetLangSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(targetLangSearch.toLowerCase())
    )
  );

  const handleUpload = async (data: { file?: File; youtubeUrl?: string }) => {
    if (!projectName.trim()) {
      toast.warning("Please enter a project name first.");
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading("Starting dubbing pipeline...");
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
        toast.success("Project created! Redirecting...", { id: toastId });
        router.push(`/projects/${result.projectId}`);
      } else {
        throw new Error(result.error || "Failed to create project");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong", { id: toastId });
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
              {projectName.trim() && (
                <p className="text-xs text-emerald-500 font-medium flex items-center gap-1 ml-1">
                  <CheckCircle2 className="size-3" /> Looks good!
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Source Language</label>
                <Input
                  placeholder="Search..."
                  value={sourceLangSearch}
                  onChange={(e) => setSourceLangSearch(e.target.value)}
                  className="h-9 rounded-xl bg-zinc-500/5 border-none text-sm mb-1"
                />
                <select
                  className="flex h-12 w-full rounded-2xl border-none bg-zinc-500/5 px-4 text-sm font-medium outline-none cursor-pointer"
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  size={4}
                >
                  {filteredSourceLangs.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Target Language</label>
                <Input
                  placeholder="Search..."
                  value={targetLangSearch}
                  onChange={(e) => setTargetLangSearch(e.target.value)}
                  className="h-9 rounded-xl bg-zinc-500/5 border-none text-sm mb-1"
                />
                <select
                  className="flex h-12 w-full rounded-2xl border-none bg-zinc-500/5 px-4 text-sm font-medium outline-none cursor-pointer"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  size={4}
                >
                  {filteredTargetLangs.map((l) => (
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
