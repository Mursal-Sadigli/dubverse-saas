"use client";

import { Link } from "@/i18n/navigation";
import { Project } from "@/lib/types";
import { getStatusLabel, formatDate, cn } from "@/lib/utils";
import { Film, ChevronRight, Clock, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface ProjectCardProps {
  project: Project;
  layout?: "grid" | "list";
}


const stepOrder = ["uploading", "transcribing", "translating", "dubbing", "completed"];

function getProgressPercent(status: string): number {
  const idx = stepOrder.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (stepOrder.length - 1)) * 100);
}

export default function ProjectCard({ project, layout = "grid" }: ProjectCardProps) {
  const t = useTranslations("dashboard");
  const progressPercent = getProgressPercent(project.status);
  const isProcessing = !["completed", "failed"].includes(project.status);

  if (layout === "list") {
    return (
      <Link href={`/projects/${project.id}`} className="block">
        <Card className="glass group px-6 py-4 flex items-center justify-between hover:bg-zinc-500/10 transition-colors border-none">
          <div className="flex items-center gap-4 min-w-0 flex-1">
             <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <Film className="size-5 text-violet-500" />
             </div>
             <div className="min-w-0 flex-1">
                <h3 className="font-bold truncate">{project.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                   <Globe className="size-3" />
                   {project.sourceLanguage.toUpperCase()} → {project.targetLanguage.toUpperCase()}
                   <span className="mx-1.5">•</span>
                   <Clock className="size-3" />
                   {formatDate(project.createdAt)}
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             {isProcessing && (
                <div className="hidden md:flex flex-col items-end gap-1.5 w-32">
                   <span className="text-[10px] uppercase font-bold text-violet-500 tracking-wider">Processing</span>
                   <Progress value={progressPercent} className="h-1" />
                </div>
             )}
             <Badge
                variant={
                  project.status === "completed" ? "success" : 
                  project.status === "failed" ? "destructive" : 
                  "processing"
                }
                className="h-7 px-3 rounded-lg"
              >
                {common(`status.${project.status}`)}
              </Badge>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="glass glass-hover group flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 border-none rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
              <Film className="size-5 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-foreground">
                {project.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-3 text-violet-400" />
                <span className="uppercase font-medium tracking-wider">{project.sourceLanguage}</span>
                <ChevronRight className="size-2.5 opacity-30" />
                <span className="uppercase font-medium tracking-wider text-violet-400">{project.targetLanguage}</span>
              </div>
            </div>
          </div>

          <Badge
            variant={
              project.status === "completed" ? "success" : 
              project.status === "failed" ? "destructive" : 
              "processing"
            }
            className="rounded-lg px-2.5"
          >
            {isProcessing && (
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-current mr-1.5" />
            )}
            {common(`status.${project.status}`)}
          </Badge>
        </div>

        {isProcessing && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-violet-500">
               <span>{project.status}</span>
               <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
           <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
             <Clock className="size-3" />
             {formatDate(project.createdAt)}
           </div>
           <Button variant="ghost" size="sm" className="size-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="size-4 text-violet-500" />
           </Button>
        </div>
      </Card>
    </Link>
  );
}

