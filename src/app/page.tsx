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
              
              <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-50 grayscale-0 opacity-100 transition-all">
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

        {/* Features Section */}
        <section id="features" className="py-24 bg-zinc-500/5">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-3xl lg:text-5xl font-black mb-6">Everything you need to go global</h2>
              <p className="text-muted-foreground text-lg">Our integrated pipeline handles the entire process from speech to final video.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature, i) => (
                <div key={i} className="glass p-8 rounded-3xl group hover:-translate-y-2 transition-all duration-300 border-none shadow-sm hover:shadow-xl hover:shadow-violet-500/5">
                  <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
           <div className="container px-4 mx-auto">
              <div className="bg-linear-to-br from-violet-600 to-blue-700 rounded-[3rem] p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-violet-500/20">
                 <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight">Ready to break the language barrier?</h2>
                    <p className="text-xl text-white/80 mb-12">Join thousands of creators who are reaching new audiences every day.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                       <Button size="lg" variant="secondary" className="h-16 px-10 rounded-2xl text-xl font-black shadow-lg hover:scale-105 transition-transform" asChild>
                          <Link href="/dashboard">Start Your First Project</Link>
                       </Button>
                       <p className="text-sm font-medium text-white/60">No credit card required for free tier</p>
                    </div>
                 </div>
                 
                 {/* Decorative circles */}
                 <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                 <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
              </div>
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

const FEATURES = [
  {
    icon: <Mic2 className="size-7" />,
    title: "AI Voice Models",
    description: "Access premium neural voices that capture emotion and inflection perfectly across 50+ languages.",
  },
  {
    icon: <Zap className="size-7" />,
    title: "Instant Processing",
    description: "Our LPU-powered pipeline delivers high-quality dubs faster than real-time video length.",
  },
  {
    icon: <Globe className="size-7" />,
    title: "Global Distribution",
    description: "Direct export to various formats optimized for YouTube, TikTok, and social media platforms.",
  },
  {
    icon: <Layers className="size-7" />,
    title: "Timeline Syncing",
    description: "Automatic adjustment of translated speech to match original video pacing and visual cues.",
  },
  {
    icon: <ShieldCheck className="size-7" />,
    title: "Premium Security",
    description: "Your data and original content are encrypted and protected with enterprise-grade security.",
  },
  {
    icon: <Play className="size-7" />,
    title: "Multi-Format",
    description: "Support for MP4, MOV, and direct YouTube integration for seamless workflow.",
  },
];
