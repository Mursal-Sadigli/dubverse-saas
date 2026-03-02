"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const locales = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "az", label: "Azərbaycan", flag: "🇦🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
  ];

  function onLocaleChange(newLocale: string) {
    // next-intl's useRouter.replace handles the switch
    router.replace(pathname, { locale: newLocale });
  }

  const currentLocale = locales.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Languages className="size-4.5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => onLocaleChange(l.code)}
            className={locale === l.code ? "bg-accent font-medium" : ""}
          >
            <span className="mr-2">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
