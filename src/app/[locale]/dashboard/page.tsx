"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import ProjectCard from "@/components/ProjectCard";
import { Project, SUPPORTED_LANGUAGES } from "@/lib/types";
import { 
  Plus, 
  FolderOpen, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Search,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const common = useTranslations("common");
  const { user } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const recentProjects = projects.slice(0, 5);
  const processingProjects = projects.filter(p => !["completed", "failed"].includes(p.status));
  const completedCount = projects.filter(p => p.status === "completed").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {common("dashboard")}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("welcome", { name: user?.firstName || "there" })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-none shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="size-12" />
           </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("usage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 / 5 min</div>
            <Progress value={80} className="mt-3 h-1.5" />
            <p className="mt-2 text-[11px] text-muted-foreground">{t("quotaInfo", { percent: 80 })}</p>
          </CardContent>
        </Card>

        <Card className="glass border-none shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="size-12" />
           </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("completedCount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="mt-1 text-xs text-emerald-500 font-medium">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="glass border-none shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="size-12" />
           </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("activeJobs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingProjects.length}</div>
            <div className="mt-2 flex items-center gap-1.5">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
               </span>
               <span className="text-[11px] text-muted-foreground">Processing now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-violet-600 to-blue-600 border-none shadow-md overflow-hidden relative group">
          <CardHeader className="pb-2 group-hover:translate-x-1 transition-transform">
            <CardTitle className="text-sm font-medium text-white/80">{t("quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
             <Button 
                variant="secondary" 
                className="w-full justify-between h-10 px-4 rounded-xl font-bold group-hover:scale-[1.02] transition-transform"
                onClick={() => router.push("/dashboard/new")}
             >
                {common("newDub")}
                <Plus className="size-4" />
             </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="size-5 text-violet-500" />
              {t("recent")}
            </h2>
            <Button variant="ghost" size="sm" className="text-violet-500 font-bold" onClick={() => router.push("/dashboard/projects")}>
               {t("viewAll")} <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>

          {recentProjects.length === 0 ? (
            <Card className="glass border-dashed border-2 py-12 text-center flex flex-col items-center">
              <FolderOpen className="size-10 text-muted-foreground/30 mb-4" />
              <CardDescription>{t("noProjects")}</CardDescription>
              <Button variant="outline" className="mt-6 rounded-xl" onClick={() => router.push("/dashboard/new")}>
                <Plus className="size-4 mr-2" /> {t("startFirst")}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>

        {/* Processing Jobs Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="size-5 text-amber-500" />
            {t("processing")}
          </h2>
          
          <div className="space-y-3">
            {processingProjects.length === 0 ? (
               <div className="rounded-2xl border border-dashed p-8 text-center bg-zinc-500/5">
                  <p className="text-sm text-muted-foreground italic">{t("noJobs")}</p>
               </div>
            ) : (
               processingProjects.map(p => (
                 <Card key={p.id} className="glass group overflow-hidden border-none cursor-pointer hover:bg-zinc-500/10 transition-colors" onClick={() => router.push(`/projects/${p.id}`)}>
                    <CardContent className="p-4 flex gap-4 items-center">
                       <div className="size-12 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                          <Clock className="size-6 text-violet-500 animate-pulse" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <div className="font-bold truncate text-sm">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground capitalize">{common(`status.${p.status}`)}...</div>
                          <Progress value={45} className="h-1 mt-2" />
                       </div>
                    </CardContent>
                 </Card>
               ))
            )}
          </div>
          
          <Card className="bg-zinc-500/5 border-none p-6 text-center space-y-4 rounded-[2rem]">
             <h3 className="font-bold">{t("upgradeTitle")}</h3>
             <p className="text-sm text-muted-foreground">{t("upgradeDesc")}</p>
             <Button variant="premium" className="w-full rounded-2xl shadow-lg font-black">{t("upgradeBtn")}</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

