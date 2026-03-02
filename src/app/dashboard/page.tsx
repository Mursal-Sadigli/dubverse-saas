"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";
import { 
  Plus, 
  FolderOpen, 
  Zap, 
  Clock, 
  CheckCircle2, 
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

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
      {/* Recent Projects Hub */}
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderOpen className="size-5 text-violet-500" />
            Your Projects
          </h2>
          <Button variant="premium" className="font-bold shadow-md rounded-xl" asChild>
            <Link href="/dashboard/new">
              <Plus className="size-4 mr-2" />
              New Dub
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="glass border-dashed border-2 py-16 text-center flex flex-col items-center shadow-none">
            <FolderOpen className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No projects yet</h3>
            <CardDescription className="mb-6">Start by creating your first dubbed video.</CardDescription>
            <Button variant="outline" className="rounded-xl shadow-xs" onClick={() => router.push("/dashboard/new")}>
              <Plus className="size-4 mr-2" /> Create Project
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
