"use client";

import { useState, useCallback } from "react";
import { Upload, Link2, X, Film, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (data: { file?: File; youtubeUrl?: string }) => void;
  isLoading?: boolean;
}

export default function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [mode, setMode] = useState<"file" | "youtube">("file");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");

  const validateYoutubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    return pattern.test(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
      setError("");
    } else {
      setError("Please drop a video file (MP4, MOV, AVI, etc.)");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  };

  const handleSubmit = () => {
    setError("");
    if (mode === "file") {
      if (!file) { setError("Please select a video file."); return; }
      onUpload({ file });
    } else {
      if (!youtubeUrl) { setError("Please enter a YouTube URL."); return; }
      if (!validateYoutubeUrl(youtubeUrl)) { setError("Invalid YouTube URL. Supported: /watch, /shorts, youtu.be"); return; }
      onUpload({ youtubeUrl });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl bg-foreground/5 p-1">
        {(["file", "youtube"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); setFile(null); setYoutubeUrl(""); }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
              mode === m 
                ? "bg-violet-500/20 text-violet-300" 
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            {m === "file" ? <Upload className="size-4" /> : <Link2 className="size-4" />}
            {m === "file" ? "Upload File" : "YouTube URL"}
          </button>
        ))}
      </div>

      {/* File upload zone */}
      {mode === "file" && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
            dragging
              ? "border-violet-500 bg-violet-500/5"
              : file
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-foreground/10 bg-foreground/5 hover:bg-foreground/10"
          )}
        >
          <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
          
          {file ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/15">
                <Film className="size-6 text-emerald-500" />
              </div>
              <div>
                <p className="mb-1 font-semibold text-foreground">{file.name}</p>
                <p className="text-[13px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="mt-2 h-8 gap-1.5 text-xs text-destructive-foreground"
                onClick={(e) => { e.preventDefault(); setFile(null); }}
              >
                <X className="size-3.5" /> Remove
              </Button>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/10 transition-transform duration-200 group-hover:scale-110">
                <Upload className="size-6 text-violet-500" />
              </div>
              <div>
                <p className="mb-1 font-semibold text-foreground">Drop your video here</p>
                <p className="text-[13px] text-muted-foreground">or click to browse · MP4, MOV, AVI · Max 500MB</p>
              </div>
            </>
          )}
        </label>
      )}

      {/* YouTube URL input */}
      {mode === "youtube" && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
              <Link2 className="size-4" />
            </div>
            <Input
              type="url"
              className="pl-10 h-11"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); setError(""); }}
            />
          </div>
          <p className="text-[13px] text-muted-foreground">
            Paste any YouTube video URL · Max 30 minutes
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        variant="premium"
        size="lg"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full text-[15px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Film className="size-4" />
            Start Dubbing
          </>
        )}
      </Button>
    </div>
  );
}
