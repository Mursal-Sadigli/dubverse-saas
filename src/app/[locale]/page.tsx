"use client";

import Navbar from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Mic2, Globe, Zap, Download, ArrowRight,
  CheckCircle2, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("landing");
  const common = useTranslations("common");

  const FEATURES = [
    {
      icon: <Mic2 className="size-5.5 text-violet-500" />,
      title: "Speech to Text",
      desc: "Powered by Grok AI — automatically transcribes your video with accurate timestamps.",
    },
    {
      icon: <Globe className="size-5.5 text-blue-500" />,
      title: "Context-Aware Translation",
      desc: "Not just word-for-word. Grok preserves tone, context and natural speech patterns.",
    },
    {
      icon: <Zap className="size-5.5 text-amber-500" />,
      title: "AI Voice Dubbing",
      desc: "Advanced TTS generates natural-sounding voices synced to the original video.",
    },
    {
      icon: <Download className="size-5.5 text-emerald-500" />,
      title: "Instant Export",
      desc: "Download your dubbed video as MP4, subtitles as SRT, or audio track only.",
    },
  ];

  const STEPS = [
    { num: "01", title: "Upload or paste URL", desc: "Upload an MP4 or paste a YouTube link" },
    { num: "02", title: "Choose target language", desc: "Select from 14 supported languages" },
    { num: "03", title: "AI does its magic", desc: "Transcription → Translation → Voice dubbing" },
    { num: "04", title: "Download dubbed video", desc: "Get your MP4 with full AI dubbing" },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-24 text-center px-6">
        <div className="bg-blob left-1/2 -top-24 size-[600px] -translate-x-1/2 bg-violet-500/10" />
        <div className="bg-blob right-[5%] top-24 size-[400px] bg-blue-500/5" />

        <div className="container relative max-w-4xl">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 backdrop-blur-md">
            <Zap className="size-3.5 text-violet-500" />
            <span className="text-[13px] font-semibold text-violet-300">Powered by Grok AI + Edge-TTS</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {t("title").split("any language")[0]}
            <span className="text-gradient">any language</span>
            {t("title").split("any language")[1]}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            {t("subtitle")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="premium" size="lg" className="h-14 gap-2.5 rounded-xl px-8 text-base" asChild>
              <Link href="/sign-up">
                {t("cta")} <ArrowRight className="size-4.5" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" className="h-14 gap-2.5 rounded-xl px-8 text-base" asChild>
              <Link href="/sign-in">
                <Play className="size-4" /> {common("signIn")}
              </Link>
            </Button>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              ["14+", "Languages supported"],
              ["30 min", "Max video length"],
              ["~3 min", "Avg processing time"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold tracking-tight text-foreground">{num}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-6xl py-24">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything you need to dub
          </h2>
          <p className="text-lg text-muted-foreground">No timelines. No expensive studios. Just AI.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass glass-hover rounded-[20px] p-7">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-foreground/5 py-24 border-y border-foreground/5">
        <div className="container max-w-5xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="text-muted-foreground">4 simple steps from raw video to dubbed masterpiece</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.num} className="relative p-6">
                <div className="mb-3 text-5xl font-black leading-none tracking-tight text-violet-500/15">{step.num}</div>
                <h3 className="mb-2 text-base font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="container max-w-3xl">
          <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to go global?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Start dubbing your first video for free. No credit card required.
          </p>
          <Button variant="premium" size="lg" className="h-14 gap-2.5 rounded-xl px-10 text-base" asChild>
            <Link href="/sign-up">
              Get started for free <ArrowRight className="size-5" />
            </Link>
          </Button>

          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {["Free to start", "14 languages", "Export MP4 & SRT"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="size-4 text-violet-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-foreground/5 py-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Mic2 className="size-4 text-violet-500" />
          <span className="font-bold text-foreground">Dubverse</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Dubverse. All rights reserved.</p>
      </footer>
    </div>
  );
}

