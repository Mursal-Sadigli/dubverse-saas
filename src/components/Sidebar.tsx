"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderSearch, 
  Settings, 
  PlusCircle, 
  History,
  Crown,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MonitorPlay
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: PlusCircle, label: "New Dub", href: "/dashboard/new" },
  { icon: FolderSearch, label: "My Projects", href: "/dashboard/projects" },
  { icon: History, label: "History", href: "/dashboard/history" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "sticky top-0 h-screen z-40 bg-background/95 backdrop-blur-md border-r transition-all duration-300 ease-in-out flex flex-col group/sidebar shrink-0",
      isCollapsed ? "w-20" : "w-64",
      className
    )}>
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 size-6 rounded-full bg-background border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-50 opacity-0 group-hover/sidebar:opacity-100"
      >
        {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      <div className="flex-1 py-6 px-3 space-y-8">
        {/* Main Navigation */}
        <div className="space-y-1.5">
          {!isCollapsed && <p className="px-3 text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">Main Menu</p>}
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                pathname === item.href
                  ? "bg-violet-600/10 text-violet-600 font-bold shadow-[0_0_15px_-3px_rgba(139,92,246,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-zinc-500/10"
              )}
            >
              <item.icon className={cn(
                "size-5 transition-transform duration-200 group-hover:scale-110 shrink-0",
                pathname === item.href ? "text-violet-600" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!isCollapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
              {pathname === item.href && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-violet-600 rounded-r-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Advanced Section */}
        <div className="space-y-4">
           {!isCollapsed && (
              <div className="px-3">
                 <p className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">Account</p>
                 <div className="p-4 rounded-2xl bg-linear-to-br from-violet-600/10 to-blue-600/10 border border-violet-500/10 space-y-4">
                    <div className="flex items-center gap-2">
                       <Crown className="size-4 text-violet-500" />
                       <span className="text-xs font-bold">Free Plan</span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>Usage</span>
                          <span>80%</span>
                       </div>
                       <div className="h-1.5 w-full bg-zinc-500/20 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 w-[80%]" />
                       </div>
                    </div>
                    <Button variant="premium" size="sm" className="w-full text-[10px] h-7 rounded-lg font-black uppercase tracking-wider shadow-md">Upgrade</Button>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border/50">
        <Link 
          href="/dashboard/help" 
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-500/10 transition-colors group",
            isCollapsed && "justify-center"
          )}
        >
          <HelpCircle className="size-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Help Support</span>}
        </Link>
      </div>
    </aside>
  );
}
