"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";
import { Plus, Mic2, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      toast.error("Layihələr yüklənə bilmədi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  // Klaviatura qısayolu: "/" basıb yeni dublaj aç
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
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
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
          <Button variant="premium" className="font-bold shadow-md rounded-xl" asChild>
            <Link href="/dashboard/new">
              <Plus className="size-4 mr-2" />
              Yeni Dublaj
            </Link>
          </Button>
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
