"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  PlusCircle,
  Download,
  Settings,
  Mic2,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserButton } from "@clerk/nextjs";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const t = useTranslations("common");
  const tDash = useTranslations("dashboard");
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);


  const NAV_ITEMS = [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("projects"), href: "/dashboard/projects", icon: Video },
    { label: t("newDub"), href: "/dashboard/new", icon: PlusCircle },
    { label: t("exports"), href: "/dashboard/exports", icon: Download },
    { label: t("settings"), href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-blue-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Mic2 className="size-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground">
              Dub<span className="text-violet-500">verse</span>
            </span>
          )}
        </Link>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-500/10 text-violet-500"
                  : "text-muted-foreground hover:bg-zinc-500/5 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-5 shrink-0 transition-colors",
                  isActive ? "text-violet-500" : "group-hover:text-foreground"
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto size-1.5 rounded-full bg-violet-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage Stats (Only when not collapsed) */}
      {!isCollapsed && (
        <div className="mx-4 mb-4 rounded-2xl border bg-zinc-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{tDash("usage")}</span>
            <Zap className="size-3 text-amber-500" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                <span>{tDash("freePlan")}</span>
                <span>80% {tDash("used")}</span>
              </div>
              <Progress value={80} className="h-1.5" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {tDash("remaining", { count: 4 })}
            </p>
            <Button variant="premium" size="sm" className="h-8 w-full text-[11px] font-bold">
              {tDash("upgrade")}
            </Button>
          </div>
        </div>
      )}


      {/* Footer Settings */}
      <div className="mt-auto p-4 space-y-4">
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-4" : "justify-between")}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        
        <Separator />
        
        <div className={cn("flex items-center gap-3 py-2 px-2", isCollapsed ? "justify-center" : "")}>
          <UserButton
            appearance={{
              elements: {
                avatarBox: isCollapsed ? "size-9" : "size-8",
              },
            }}
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold leading-none">{t("account")}</span>
              <span className="truncate text-[11px] text-muted-foreground">{t("manageProfile")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-card p-0 shadow-sm hover:bg-accent"
      >
        {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
      </Button>
    </aside>
  );
}
