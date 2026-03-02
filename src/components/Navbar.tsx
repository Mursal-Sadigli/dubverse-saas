"use client";

import { Link } from "@/i18n/navigation";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function Navbar() {
  const t = useTranslations("common");

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-foreground/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-blue-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Mic2 className="size-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Dub<span className="text-violet-500">verse</span>
          </span>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          
          <SignedOut>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
            <Button variant="premium" size="sm" asChild>
              <Link href="/sign-up">{t("startFree")}</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-9 rounded-xl",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

