"use client";

import Link from "next/link";
import { Project } from "@/lib/types";
import { 
  Play, 
  Calendar, 
  Languages, 
  MoreVertical, 
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, class: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Pending", pulse: true },
  uploading: { icon: Clock, class: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Uploading", pulse: true },
  transcribing: { icon: Clock, class: "bg-violet-500/10 text-violet-500 border-violet-500/20", label: "Transcribing", pulse: true },
  translating: { icon: Languages, class: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", label: "Translating", pulse: true },
  dubbing: { icon: Play, class: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20", label: "Dubbing", pulse: true },
  completed: { icon: CheckCircle2, class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Completed", pulse: false },
  failed: { icon: AlertCircle, class: "bg-red-500/10 text-red-500 border-red-500/20", label: "Failed", pulse: false }
};

export default function ProjectCard({ project, onDelete, onRetry }: ProjectCardProps) {
  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isProcessing = status.pulse;

  return (
    <Card className="glass group overflow-hidden border-zinc-500/10 hover:border-violet-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-violet-500/5">
      <CardContent className="p-0 relative aspect-video bg-zinc-900 overflow-hidden">
        {project.thumbnailUrl ? (
          <img 
            src={project.thumbnailUrl} 
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-violet-500/20 to-blue-500/20 group-hover:from-violet-500/30 transition-colors">
            <Play className="size-12 text-violet-500/40 group-hover:scale-110 transition-transform" />
          </div>
        )}
        
        {/* Play Overlay - only for completed */}
        {project.status === "completed" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
             <Button variant="premium" size="icon" className="size-12 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300" asChild>
               <Link href={`/projects/${project.id}`}>
                 <Play className="size-6 fill-current" />
               </Link>
             </Button>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] gap-2">
            <div className="size-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <RefreshCw className="size-5 text-violet-400 animate-spin" />
            </div>
            <span className="text-xs font-semibold text-white/80 capitalize animate-pulse">{status.label}...</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className={cn("rounded-lg font-bold border shadow-sm flex items-center gap-1.5 px-2.5 py-1", status.class)}>
            <StatusIcon className={cn("size-3", isProcessing && "animate-pulse")} />
            {status.label}
          </Badge>
          <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-white border-white/10 rounded-lg font-bold">
            <Languages className="size-3 mr-1" />
            {project.targetLanguage}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-5 flex flex-col items-start gap-4">
        <div className="flex items-start justify-between w-full gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-base truncate group-hover:text-violet-500 transition-colors">{project.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium italic">
              <Calendar className="size-3" />
              {new Date(project.updatedAt).toLocaleDateString()}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg shrink-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-none shadow-xl rounded-xl p-1 min-w-[160px]">
              <DropdownMenuItem className="rounded-lg cursor-pointer font-medium" asChild>
                <Link href={`/projects/${project.id}`} className="flex items-center gap-2">
                  <ExternalLink className="size-4" /> Open Project
                </Link>
              </DropdownMenuItem>
              {project.status === "failed" && onRetry && (
                <DropdownMenuItem 
                  className="rounded-lg cursor-pointer font-medium text-amber-500 focus:text-amber-500 focus:bg-amber-500/10"
                  onClick={() => onRetry(project.id)}
                >
                  <RefreshCw className="size-4 mr-2" /> Retry
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    className="rounded-lg cursor-pointer font-medium text-red-500 focus:text-red-500 focus:bg-red-500/10"
                    onClick={() => onDelete(project.id)}
                  >
                    <Trash2 className="size-4 mr-2" /> Delete Project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
