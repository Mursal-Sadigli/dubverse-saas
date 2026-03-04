import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WaveformTimeline from "./WaveformTimeline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Subtitle {
  id: string;
  start: number;
  end: number;
  text: string;
  translatedText?: string;
  speaker_id?: number;
  speaker_gender?: string;
}

interface SubtitleEditorProps {
  subtitles: Subtitle[];
  audioUrl?: string;
  onChange?: (updated: Subtitle) => void;
}

function toTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

function EditableCell({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await onSave(draft); setEditing(false); }
    catch { toast.error("Saxlanmadı"); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="flex items-start gap-1">
        <textarea
          autoFocus
          className="flex-1 min-h-[56px] resize-none rounded-lg border border-violet-500/50 bg-violet-500/5 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        />
        <div className="flex flex-col gap-1 pt-1">
          <button onClick={save} disabled={saving} className="flex size-7 items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          </button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="flex size-7 items-center justify-center rounded-md border hover:bg-muted">
            <X className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-2 cursor-pointer" onClick={() => setEditing(true)}>
      <p className="leading-relaxed text-sm">{value || <span className="text-muted-foreground/50 italic">boş</span>}</p>
      <Pencil className="size-3.5 mt-0.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}

export default function SubtitleEditor({ subtitles, audioUrl, onChange }: SubtitleEditorProps) {
  const { getToken } = useAuth();

  const saveField = useCallback(async (id: string, field: "text" | "translatedText", value: string) => {
    const token = await getToken();
    const res = await fetch(`${API}/api/subtitles/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error("Server error");
    toast.success("Saxlandı ✅", { duration: 1200 });
  }, [getToken]);

  return (
    <div className="space-y-4">
      {audioUrl && <WaveformTimeline url={audioUrl} />}
      
      <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[80px_60px_1fr_1fr] gap-3 px-4 py-3 border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Vaxt</span>
        <span>Spiker</span>
        <span>Orijinal</span>
        <span className="text-violet-400">Tərcümə</span>
      </div>

      {/* Rows */}
      <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
        {subtitles.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Transkripsiyadan sonra burada görünəcək.</p>
        )}
        {subtitles.map((sub) => (
          <div key={sub.id} className={cn("grid grid-cols-[80px_60px_1fr_1fr] gap-3 px-4 py-3 hover:bg-muted/20 transition-colors")}>
            <span className="font-mono text-[11px] text-muted-foreground pt-0.5 whitespace-nowrap">
              {toTime(sub.start)}<br />→ {toTime(sub.end)}
            </span>
            <div className="flex items-start pt-0.5">
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                sub.speaker_id === 2 ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : 
                sub.speaker_id === 3 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                "bg-violet-500/10 text-violet-500 border border-violet-500/20"
              )}>
                S{sub.speaker_id || 1}
              </span>
            </div>
            <EditableCell
              value={sub.text}
              onSave={(v) => saveField(sub.id, "text", v)}
            />
            <EditableCell
              value={sub.translatedText || ""}
              onSave={(v) => saveField(sub.id, "translatedText", v)}
            />
          </div>
        ))}
      </div>

      {subtitles.length > 0 && (
        <div className="px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
          💡 Hər hücrəyə basıb redaktə edin · <kbd className="font-mono">Ctrl+Enter</kbd> saxla · <kbd className="font-mono">Esc</kbd> ləğv et
        </div>
      )}
      </div>
    </div>
  );
}
