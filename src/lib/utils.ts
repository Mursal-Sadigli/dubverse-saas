import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "failed": return "text-red-400 bg-red-400/10 border-red-400/20";
    case "uploading":
    case "transcribing":
    case "translating":
    case "dubbing": return "text-violet-400 bg-violet-400/10 border-violet-400/20";
    default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "uploading": return "uploading";
    case "transcribing": return "transcribing";
    case "translating": return "translating";
    case "dubbing": return "dubbing";
    case "completed": return "completed";
    case "failed": return "failed";
    default: return status;
  }
}
