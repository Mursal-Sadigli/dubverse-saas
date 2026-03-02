"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, Menu, X, LayoutDashboard, PlusCircle, Video, Settings, History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: PlusCircle, label: "New Dub", href: "/dashboard/new" },
  { icon: Video, label: "My Projects", href: "/dashboard/projects" },
  { icon: History, label: "History", href: "/dashboard/history" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden flex h-16 items-center px-4 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40 lg:hidden">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Menu className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" className="w-[300px] p-0 border-none glass mt-2 overflow-hidden rounded-2xl shadow-2xl">
          <div className="p-6 border-b border-foreground/5 bg-background/50">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-blue-600 shadow-lg">
                <Mic2 className="size-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">Dubverse</span>
            </Link>
          </div>
          
          <div className="flex flex-col py-4 bg-background/50">
            <div className="px-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <DropdownMenuItem key={item.href} asChild className="p-0 focus:bg-transparent">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full ${
                        isActive 
                          ? "bg-violet-600/10 text-violet-600 font-bold" 
                          : "text-muted-foreground hover:text-foreground hover:bg-zinc-500/5"
                      }`}
                    >
                      <item.icon className={`size-5 ${isActive ? "text-violet-600" : ""}`} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </div>
            
            <DropdownMenuItem className="p-0 focus:bg-transparent">
               <div className="px-4 py-4 w-full">
                  <Button variant="premium" className="w-full h-11 rounded-xl font-bold shadow-lg" onClick={() => setOpen(false)}>
                     Upgrade to Pro
                  </Button>
               </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link href="/" className="ml-4 flex items-center gap-2">
         <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-blue-600 shadow-sm">
           <Mic2 className="size-4 text-white" />
         </div>
         <span className="text-lg font-bold tracking-tight">Dubverse</span>
      </Link>
    </div>
  );
}
