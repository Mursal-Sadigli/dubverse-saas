"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

interface WaveformTimelineProps {
  url: string;
}

export default function WaveformTimeline({ url }: WaveformTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4f46e5", // violet-600
      progressColor: "#a855f7", // fuchsia-500
      cursorColor: "#ffffff",
      barWidth: 2,
      barGap: 3,
      height: 64,
      normalize: true,
      minPxPerSec: 50,
      hideScrollbar: false,
    });

    ws.on("ready", () => {
      setIsLoading(false);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    ws.load(url);
    wavesurfer.current = ws;

    return () => {
      ws.destroy();
    };
  }, [url]);

  const togglePlay = () => {
    wavesurfer.current?.playPause();
  };

  const zoom = (delta: number) => {
    if (!wavesurfer.current) return;
    const current = wavesurfer.current.options.minPxPerSec || 50;
    wavesurfer.current.zoom(Math.max(10, current + delta));
  };

  return (
    <div className="rounded-xl border bg-muted/20 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-2">Timeline</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => zoom(-10)} className="p-1 hover:bg-muted rounded text-muted-foreground"><ZoomOut className="size-4" /></button>
          <button onClick={() => zoom(10)} className="p-1 hover:bg-muted rounded text-muted-foreground"><ZoomIn className="size-4" /></button>
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
            <Loader2 className="size-5 animate-spin text-violet-500" />
          </div>
        )}
        <div ref={containerRef} className="rounded-lg overflow-hidden" />
      </div>
    </div>
  );
}
