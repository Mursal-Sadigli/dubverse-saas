"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";
import { Plus, Mic2, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<{ plan: string, minutesUsed: number, minutesLimit: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const token = await getToken();
      const [projRes, usageRes] = await Promise.all([
        fetch(`${API}/api/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/billing/usage`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (projRes.ok) {
        const data = await projRes.json();
        setProjects(data.projects || []);
      }
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }
    } catch {
      toast.error("Məlumatlar yüklənə bilmədi");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        router.push("/dashboard/new");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        toast.success("Layihə silindi");
      } else {
        toast.error("Layihə silinə bilmədi");
      }
    } catch {
      toast.error("Layihə silinə bilmədi");
    }
  };

  const recentProjects = projects.slice(0, 9);

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" asChild>
              <Link href="/"><ChevronLeft className="size-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Layihələriniz</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Yeni dublaj üçün <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-xs font-mono border">/</kbd> düyməsini basın
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {usage && (
              <div className="text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/10 hidden sm:block">
                <span className="text-gray-400 mr-2">Kredit:</span>
                <strong className={usage.minutesUsed >= usage.minutesLimit ? "text-red-400" : "text-white"}>
                  {usage.minutesUsed} / {usage.minutesLimit} dəq
                </strong>
                {usage.plan === "free" && (
                   <Link href="/pricing" className="ml-3 text-blue-400 hover:text-blue-300 font-medium">Pro al</Link>
                )}
              </div>
            )}
            <Button variant="premium" className="font-bold shadow-md rounded-xl" asChild>
              <Link href="/dashboard/new">
                <Plus className="size-4 mr-2" />
                Yeni Dublaj
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-500/10 overflow-hidden animate-pulse">
                <div className="aspect-video bg-zinc-500/10" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-zinc-500/10 rounded-full w-3/4" />
                  <div className="h-3 bg-zinc-500/10 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <Card className="border-dashed border-2 py-20 text-center flex flex-col items-center shadow-none bg-transparent">
            <div className="size-20 rounded-3xl bg-violet-500/10 flex items-center justify-center mb-5">
              <Mic2 className="size-10 text-violet-500/50" />
            </div>
            <h3 className="text-xl font-bold">Hələ layihə yoxdur</h3>
            <CardDescription className="mb-8 mt-2 max-w-xs">
              Dəqiqələr içində ilk AI dublajlı videonu yarat. Fayl yüklə və ya YouTube linki yapışdır.
            </CardDescription>
            <Button variant="premium" className="rounded-xl font-bold shadow-lg px-6" onClick={() => router.push("/dashboard/new")}>
              <Sparkles className="size-4 mr-2" /> İlk Dublajını Başlat
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
