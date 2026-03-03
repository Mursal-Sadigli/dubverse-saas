"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "uploading",   label: "Yüklənir"     },
  { key: "transcribing",label: "Transkripsiya" },
  { key: "translating", label: "Tərcümə"       },
  { key: "dubbing",     label: "Dublaj"        },
  { key: "completed",   label: "Hazır"         },
];

const stepIndex = (status: string) => STEPS.findIndex((s) => s.key === status);

export default function StepProgress({ status }: { status: string }) {
  const current = status === "failed" ? -1 : stepIndex(status);
  const isProcessing = !["completed", "failed"].includes(status);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const isDone   = current > i;
          const isActive = current === i;
          const isFailed = status === "failed";
          const isLast   = i === STEPS.length - 1;

          return (
            <div key={step.key} className={cn("flex flex-col items-center gap-2", !isLast && "flex-1")}>
              {/* Circle + connector row */}
              <div className="flex w-full items-center">
                {/* Node */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-500",
                    isDone  && "border-emerald-500 bg-emerald-500/15 text-emerald-500",
                    isActive && !isFailed && "border-violet-500 bg-violet-500/20 text-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.4)] animate-pulse",
                    isFailed && "border-destructive bg-destructive/15 text-destructive",
                    !isDone && !isActive && !isFailed && "border-border text-muted-foreground"
                  )}
                >
                  {isDone
                    ? <Check className="size-4" strokeWidth={3} />
                    : isActive && isProcessing
                      ? <Loader2 className="size-4 animate-spin" />
                      : <span>{i + 1}</span>
                  }
                </div>

                {/* Connector */}
                {!isLast && (
                  <div
                    className={cn(
                      "h-[2px] flex-1 mx-1 transition-all duration-700",
                      isDone ? "bg-emerald-500" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-center text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors",
                  isDone   && "text-emerald-500",
                  isActive && !isFailed && "text-violet-400",
                  isFailed && "text-destructive",
                  !isDone && !isActive && !isFailed && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
