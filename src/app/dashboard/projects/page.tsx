"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";
import { 
  Search, 
  Filter, 
  FolderOpen, 
  Plus,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Projects
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Manage and track all your video dubbing projects.
            <Badge variant="secondary" className="bg-zinc-500/10 text-zinc-400 border-none font-bold">
               {projects.length} Total
            </Badge>
          </p>
        </div>
        <Button variant="premium" className="rounded-xl font-bold shadow-lg" onClick={() => router.push("/dashboard/new")}>
          <Plus className="size-4 mr-2" /> New Dub
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects by name..." 
            className="pl-10 h-11 bg-zinc-500/5 border-none rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-zinc-500/5 rounded-xl p-1 flex items-center gap-1">
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="icon" 
                className="size-9 rounded-lg"
                onClick={() => setViewMode("grid")}
              >
                 <LayoutGrid className="size-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="icon" 
                className="size-9 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                 <ListIcon className="size-4" />
              </Button>
           </div>
           
           <Button variant="outline" className="rounded-xl border-zinc-500/20 bg-transparent h-11">
              <Filter className="size-4 mr-2" /> Filter
           </Button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-zinc-500/20 bg-zinc-500/5 py-24 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-violet-500/10">
            <FolderOpen className="size-10 text-violet-500" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">
            {searchQuery ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="mb-8 max-w-sm text-muted-foreground">
            {searchQuery 
              ? `We couldn't find any projects matching "${searchQuery}". Maybe try a different search?`
              : "You haven't created any dubbing projects yet. Start by creating your first one!"}
          </p>
          {!searchQuery && (
             <Button variant="premium" className="h-12 px-8 rounded-2xl font-black shadow-lg" onClick={() => router.push("/dashboard/new")}>
               <Plus className="size-5 mr-2" /> Start First Dub
             </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" 
          : "space-y-3"
        }>
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} layout={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
