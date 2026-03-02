"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mic2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-xl lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-2">
        <Menu className="size-5" />
      </Button>
      
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-blue-600 shadow-sm">
          <Mic2 className="size-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Dubverse</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      </div>
    </header>
  );
}
