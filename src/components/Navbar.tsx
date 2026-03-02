"use client";

import Link from "next/link";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Mic2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black italic group p-2">
          <Mic2 className="size-6 text-violet-600 transition-transform group-hover:scale-110" />
          <div className="flex">
            <span className="text-violet-600 tracking-tighter">DUB</span>
            <span className="tracking-tighter">VERSE</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            Pricing
          </Link>
          
          <div className="h-6 w-px bg-border mx-2" />
          
          <ThemeToggle />

          {!isLoaded ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-4">
              <Button variant="premium" size="sm" className="h-9 px-4 rounded-xl font-bold shadow-lg" asChild>
                <Link href="/dashboard">
                  <Plus className="mr-2 size-4" />
                  New Dub
                </Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <Button variant="ghost" className="font-bold rounded-xl h-9">Log In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="font-bold bg-violet-600 hover:bg-violet-700 rounded-xl h-9 shadow-lg shadow-violet-500/10">
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-2">
           <ThemeToggle />
           <MobileNav />
        </div>
      </div>
    </nav>
  );
}
