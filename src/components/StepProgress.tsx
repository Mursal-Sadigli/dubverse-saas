"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "uploading", label: "Upload" },
  { key: "transcribing", label: "Transcribe" },
  { key: "translating", label: "Translate" },
  { key: "dubbing", label: "Dub" },
  { key: "completed", label: "Done" },
];

const stepIndex = (status: string) => STEPS.findIndex((s) => s.key === status);

interface StepProgressProps {
  status: string;
}

export default function StepProgress({ status }: StepProgressProps) {
  const current = status === "failed" ? -1 : stepIndex(status);

  return (
    <div className="flex items-center overflow-x-auto py-1">
      {STEPS.map((step, i) => {
        const isDone = current > i;
        const isActive = current === i;
        const isFailed = status === "failed" && i <= stepIndex("dubbing");
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className={cn("flex items-center", !isLast && "flex-1")}>
            {/* Circle Node */}
            <div className="flex min-w-[60px] shrink-0 flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                  isDone && "border-emerald-500 bg-emerald-500/15 text-emerald-500",
                  isActive && "animate-pulse border-violet-500 bg-violet-500/20 text-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.4)]",
                  isFailed && "border-destructive bg-destructive/15 text-destructive",
                  !isDone && !isActive && !isFailed && "border-foreground/10 text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-[11px] font-medium transition-colors",
                  isDone ? "text-emerald-500" : isActive ? "text-violet-400" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  "mx-1 mb-5 h-[2px] flex-1 transition-all duration-300",
                  isDone ? "bg-linear-to-r from-emerald-500 to-emerald-500" : "bg-foreground/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
