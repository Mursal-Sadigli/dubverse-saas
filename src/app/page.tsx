"use client";

import Link from "next/link";
import { useUser, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useState, useEffect, useRef } from "react";
import { 
  Zap, Globe, Mic2, ArrowRight, Play, Github, 
  Upload, Languages, Download, X, Volume2,
  ChevronDown, Star, CheckCircle2, Sparkles
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/types";

/* ─── Hooks ─── */
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Demo Modal ─── */
function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 backdrop-blur-md p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 size-9 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition">
          <X className="size-4" />
        </button>
        <div className="aspect-video bg-zinc-950 flex flex-col items-center justify-center gap-4">
          <div className="size-20 rounded-3xl bg-violet-500/10 flex items-center justify-center">
            <Volume2 className="size-10 text-violet-500/50" />
          </div>
          <p className="text-white/60 font-semibold">Demo videonu tezliklə əlavə edəcəyik</p>
          <p className="text-white/30 text-sm">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Scrolling language banner ─── */
function LanguageBanner() {
  const langs = [...SUPPORTED_LANGUAGES, ...SUPPORTED_LANGUAGES, ...SUPPORTED_LANGUAGES];
  return (
    <div className="relative overflow-hidden py-4 border-y border-foreground/5 bg-foreground/[0.01]">
      {/* fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-linear-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-linear-to-l from-background to-transparent pointer-events-none" />
      <div className="flex animate-[marquee_28s_linear_infinite] gap-8 w-max">
        {langs.map((l, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-bold text-muted-foreground whitespace-nowrap px-3 py-1.5 rounded-full bg-foreground/5">
            <span className="text-base">{l.flag}</span> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-foreground/8 last:border-0">
      <button 
        className="flex w-full items-center justify-between py-5 text-left font-semibold hover:text-violet-500 transition-colors gap-4"
        onClick={() => setOpen(o => !o)}
      >
        <span>{q}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5" : "max-h-0"}`}>
        <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const { isSignedIn } = useUser();
  const [demoOpen, setDemoOpen] = useState(false);
  const [tryUrl, setTryUrl] = useState("");
  const [tryError, setTryError] = useState("");
  const [heroVisible, setHeroVisible] = useState(false);

  // Hero entrance animation
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: howRef, inView: howInView } = useInView();
  const { ref: testimonialRef, inView: testimonialInView } = useInView();
  const { ref: faqRef, inView: faqInView } = useInView();
  const { ref: ctaRef, inView: ctaInView } = useInView();

  const videos = useCounter(1200, 1800, statsInView);
  const langs = useCounter(SUPPORTED_LANGUAGES.length, 1200, statsInView);
  const minutes = useCounter(4800, 2000, statsInView);

  const handleTrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    if (!pattern.test(tryUrl)) { setTryError("Düzgün YouTube linki daxil edin"); return; }
    window.location.href = `/dashboard/new?url=${encodeURIComponent(tryUrl)}`;
  };

  const STEPS = [
    { icon: Upload, step: "01", title: "Media Yüklə", desc: "Fayl yüklə və ya YouTube linki yapışdır. MP4, MOV, AVI formatları dəstəklənir.", color: "violet" },
    { icon: Zap, step: "02", title: "AI Transkripsiya", desc: "Süni intellekt videonun orijinal səsini dəqiqliklə mətнə çevirir.", color: "blue" },
    { icon: Languages, step: "03", title: "Avtomatik Tərcümə", desc: "Mətn seçdiyiniz hədəf dilinə peşəkar səviyyədə tərcümə edilir.", color: "indigo" },
    { icon: Download, step: "04", title: "İndir & Paylaş", desc: "Dublaj edilmiş videonu MP4, yalnız audio MP3 və ya SRT formatında yüklə.", color: "emerald" },
  ];

  const colorMap: Record<string, string> = {
    violet: "bg-violet-500/15 text-violet-500 border-violet-500/20",
    blue: "bg-blue-500/15 text-blue-500 border-blue-500/20",
    indigo: "bg-indigo-500/15 text-indigo-500 border-indigo-500/20",
    emerald: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  };

  const TESTIMONIALS = [
    { name: "Leyla M.", role: "Content Creator", text: "Dubverse ilə YouTube videolarımı 5 dəqiqəyə Azərbaycan dilinə çevirdim. Keyfiyyət inanılmaz!", stars: 5 },
    { name: "Rauf H.", role: "Online Müəllim", text: "Dərs videolarımı türk dilinə dublaj etmək çox asan oldu. Tələbələrim çox məmnundur.", stars: 5 },
    { name: "Nigar Ə.", role: "Marketer", text: "Reklam materiallarımızı bir neçə dildə çox sürətlə hazırladıq. Tövsiyə edirəm!", stars: 5 },
  ];

  const FAQS = [
    { q: "Hansı video formatları dəstəklənir?", a: "MP4, MOV, AVI, MKV formatları dəstəklənir. Həmçinin YouTube, YouTube Shorts linklərini birbaşa yapışdıra bilərsiniz." },
    { q: "Dublaj nə qədər vaxt aparır?", a: "10 dəqiqəlik video təxminən 3-5 dəqiqə ərzində emal edilir. Bu videonun uzunluğuna və seçilmiş dilə görə dəyişə bilər." },
    { q: "Hansı dillər dəstəklənir?", a: `Hazırda ${SUPPORTED_LANGUAGES.length}+ dil dəstəklənir — Azərbaycan, İngilis, Türk, Rus, Alman, Fransız, İspan, Ərəb, Çin, Koreyа, Yapon və daha çox.` },
    { q: "Pulsuz istifadə edə bilərəm?", a: "Bəli! Qeydiyyatsız sınaya bilərsiniz. Qeydiyyatdan sonra aylıq müəyyən dəqiqə pulsuz verilir." },
    { q: "Subtitrləri redaktə edə bilərəm?", a: "AI yaratdığı subtitrləri layihə səhifəsindən görüb yoxlaya bilərsiniz. Tam redaktə xüsusiyyəti tezliklə əlavə ediləcək." },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative pt-28 pb-16 sm:pt-36 lg:pt-48 lg:pb-28 overflow-hidden">
          <div className="container px-4 mx-auto relative z-10">
            <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
                <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">v2.0 yayındadır</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-6 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent leading-[1.1]">
                Hər videonu AI ilə istənilən dilə dublaj edin
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Video yükləyin və ya YouTube linki yapışdırın. AI transkripsiya, tərcümə edir və seçdiyiniz dildə natural səslə dublaj edir.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                {isSignedIn ? (
                  <Button size="lg" className="w-full sm:w-auto h-13 px-8 rounded-2xl text-base font-bold bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/20 group" asChild>
                    <Link href="/dashboard">
                      Panelə keç <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                ) : (
                  <SignUpButton mode="modal">
                    <Button size="lg" className="w-full sm:w-auto h-13 px-8 rounded-2xl text-base font-bold bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/20 group">
                      Pulsuz Yoxla <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </SignUpButton>
                )}
                <Button 
                  size="lg" variant="outline" 
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl text-base font-bold group border-2"
                  onClick={() => setDemoOpen(true)}
                >
                  <Play className="mr-2 size-4 text-violet-500" /> Demo izlə
                </Button>
              </div>

              {/* Quick try box */}
              <form onSubmit={handleTrySubmit} className="max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl bg-foreground/5 border border-foreground/10">
                  <input
                    type="url"
                    value={tryUrl}
                    onChange={e => { setTryUrl(e.target.value); setTryError(""); }}
                    placeholder="YouTube linkini bura yapışdırın..."
                    className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground min-w-0"
                  />
                  <Button type="submit" size="sm" className="rounded-xl bg-violet-600 hover:bg-violet-700 h-10 px-5 font-bold shrink-0 w-full sm:w-auto">
                    Sına
                  </Button>
                </div>
                {tryError && <p className="text-xs text-red-400 mt-1.5 text-left pl-2">{tryError}</p>}
                <p className="text-xs text-muted-foreground mt-2">Qeydiyyat tələb olunmur · Dərhal sınayın</p>
              </form>
            </div>
          </div>

          {/* Background blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-16 left-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-violet-500/25 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-8 right-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-blue-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>

          {/* bottom fade-in wave */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent pointer-events-none" />
        </section>

        {/* ── Language Banner ── */}
        <LanguageBanner />

        {/* ── Stats ── */}
        <section ref={statsRef} className="py-14 sm:py-20 border-b border-foreground/5">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto text-center">
              {[
                { value: videos, suffix: "+", label: "Dublaj edilmiş Video" },
                { value: langs, suffix: "+", label: "Dəstəklənən Dil" },
                { value: minutes, suffix: "+", label: "Emal Edilmiş Dəqiqə" },
              ].map((stat, i) => (
                <div key={i} className={`transition-all duration-700 ${statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${i * 150}ms` }}>
                  <p className="text-3xl sm:text-4xl font-black text-violet-500">{stat.value.toLocaleString()}{stat.suffix}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section ref={howRef} className="py-20 sm:py-28">
          <div className="container px-4 mx-auto max-w-5xl">
            <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${howInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">Proses</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">Necə işləyir?</h2>
              <p className="text-muted-foreground text-sm sm:text-base">4 sadə addımda peşəkar dublaj</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map(({ icon: Icon, step, title, desc, color }, i) => (
                <div 
                  key={i}
                  className={`relative p-6 rounded-2xl border transition-all duration-700 ${colorMap[color].split(" ").at(-1)} bg-card ${howInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <span className="absolute top-5 right-5 text-4xl font-black text-black/15 dark:text-white/25 select-none">{step}</span>
                  <div className={`size-12 rounded-xl border flex items-center justify-center mb-4 ${colorMap[color]}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section ref={testimonialRef} className="py-20 sm:py-28 bg-foreground/[0.01] border-y border-foreground/5">
          <div className="container px-4 mx-auto max-w-5xl">
            <div className={`text-center mb-12 transition-all duration-700 ${testimonialInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">İstifadəçilər</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">İstifadəçilərimiz nə deyir?</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div 
                  key={i}
                  className={`p-6 rounded-2xl bg-card border border-foreground/8 transition-all duration-700 ${testimonialInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-violet-500">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section ref={faqRef} className="py-20 sm:py-28">
          <div className="container px-4 mx-auto max-w-2xl">
            <div className={`text-center mb-12 transition-all duration-700 ${faqInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Tez-tez soruşulan suallar</h2>
            </div>
            <div className={`rounded-2xl border border-foreground/8 divide-y divide-foreground/8 overflow-hidden bg-card transition-all duration-700 ${faqInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              {FAQS.map((item, i) => (
                <div key={i} className="px-6">
                  <FaqItem q={item.q} a={item.a} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section ref={ctaRef} className="py-20 sm:py-28 relative overflow-hidden">
          <div className={`container px-4 mx-auto max-w-2xl text-center transition-all duration-700 ${ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} relative z-10`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="size-3 text-violet-500" />
              <span className="text-xs font-bold text-violet-500">Pulsuz başla</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Videolarını bütün dünyaya çatdır</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Qeydiyyat olmadan sınayın. Heç bir kredit kartı tələb olunmur.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isSignedIn ? (
                <Button size="lg" className="rounded-2xl px-8 font-bold bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/25 group" asChild>
                  <Link href="/dashboard">Panelə keç <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button size="lg" className="rounded-2xl px-8 font-bold bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-500/25 group">
                    İndi Başla <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignUpButton>
              )}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Kredit kartı yoxdur</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Qeydiyyatsız sına</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> {SUPPORTED_LANGUAGES.length}+ dil</span>
            </div>
          </div>
          {/* BG blobs */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-10 border-t">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-black italic">
            <Mic2 className="size-5 text-violet-600" />
            <span className="text-violet-600 tracking-tighter">DUB</span><span className="tracking-tighter">VERSE</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="#" className="hover:text-violet-500 transition-colors">Twitter</Link>
            <Link href="https://github.com/Mursal-Sadigli" className="hover:text-violet-500 transition-colors flex items-center gap-1.5"><Github className="size-4" /> GitHub</Link>
            <Link href="#" className="hover:text-violet-500 transition-colors">Discord</Link>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center">© 2026 Dubverse AI. Bütün hüquqlar qorunur.</p>
        </div>
      </footer>
    </div>
  );
}
