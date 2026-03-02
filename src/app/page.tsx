"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { 
  Zap, 
  Globe, 
  Mic2, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Play,
  Github
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">v2.0 is now live</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-8 bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-[1.1]">
                Dub any video into any language with AI
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Upload a video or paste a YouTube link. Our AI transcribes, translates and dubs it in your target language.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/20 group" asChild>
                  <Link href="/dashboard">
                    Start Dubbing Free
                    <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold group border-2">
                  <Play className="mr-2 size-5 text-violet-500" /> Watch Demo
                </Button>
              </div>
              
              <div className="mt-16 flex items-center justify-center gap-8 grayscale-0 opacity-100 transition-all">
                 <div className="flex items-center gap-2 font-bold text-xl"><Zap className="text-violet-500" /> FastInference</div>
                 <div className="flex items-center gap-2 font-bold text-xl"><Mic2 className="text-violet-500" /> VoiceFlow</div>
                 <div className="flex items-center gap-2 font-bold text-xl"><Globe className="text-violet-500" /> GlobalSync</div>
              </div>
            </div>
          </div>
          
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
             <div className="absolute top-24 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] animate-pulse"></div>
             <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-2xl font-black italic">
            <span className="text-violet-600 tracking-tighter">DUB</span>
            <span className="tracking-tighter">VERSE</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="#" className="hover:text-violet-500 transition-colors">Twitter</Link>
            <Link href="https://github.com/Mursal-Sadigli" className="hover:text-violet-500 transition-colors flex items-center gap-1.5"><Github className="size-4" /> GitHub</Link>
            <Link href="#" className="hover:text-violet-500 transition-colors">Discord</Link>
          </div>
          <p className="text-xs font-medium text-muted-foreground/60">
            © 2026 Dubverse AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
