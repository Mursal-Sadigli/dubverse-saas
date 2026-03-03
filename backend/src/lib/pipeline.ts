import { getProject, updateProject } from "./supabase";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { logPipeline, runFfmpeg, getFfmpegBin } from "./ffmpeg";
import { generateTTSSegment } from "./tts";
import { transcribeAudio, translateText } from "./ai";

const execPromise = promisify(exec);

/* ── Get audio duration in seconds via ffprobe ── */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const ffmpegBin = getFfmpegBin();
    // ffprobe is bundled alongside ffmpeg-static
    const ffprobeBin = ffmpegBin.replace(/ffmpeg(\.exe)?$/, "ffprobe$1");
    const { stdout } = await execPromise(
      `"${existsSync(ffprobeBin) ? ffprobeBin : "ffprobe"}" -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { timeout: 30000 }
    );
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

/* ── Time-stretch audio to target duration using FFmpeg atempo ── */
async function stretchAudio(
  inputPath: string,
  outputPath: string,
  sourceDuration: number,
  targetDuration: number,
  projectId: string,
  index: number
): Promise<void> {
  if (sourceDuration <= 0 || targetDuration <= 0) return;

  const rawRate = sourceDuration / targetDuration;
  // atempo filter is limited to [0.5, 2.0]; chain multiple filters if needed
  const clampedRate = Math.max(0.5, Math.min(2.0, rawRate));

  if (Math.abs(clampedRate - 1.0) < 0.05) return; // nearly identical — skip

  logPipeline(projectId, `Stretching seg ${index}: ${sourceDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s (rate=${clampedRate.toFixed(2)})`);

  await execPromise(
    `"${getFfmpegBin()}" -i "${inputPath}" -filter:a "atempo=${clampedRate}" -y "${outputPath}"`,
    { timeout: 60000 }
  );
}

/* ─────────────────────────────────────────────────────────── */
export async function processPipeline(projectId: string) {
  const workDir = join(process.cwd(), "..", "tmp", "uploads", projectId);

  try {
    if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true });
    logPipeline(projectId, "Pipeline started.");

    const project = await getProject(projectId);
    if (!project) { logPipeline(projectId, "Project not found."); return; }

    if (project.status !== "uploading" && project.status !== "failed") {
      logPipeline(projectId, `Already running (${project.status}). Aborted.`);
      return;
    }

    const videoPath = await prepareVideo(projectId, workDir, project.video_path);
    const audioPath = await extractAudio(projectId, workDir, videoPath);
    const subtitles = await performTranscription(projectId, audioPath);
    const translatedSubs = await performTranslation(projectId, project, subtitles);
    const dubbedAudioPath = await performDubbing(projectId, workDir, translatedSubs, project.target_language, audioPath);
    await muxFinalVideo(projectId, workDir, videoPath, dubbedAudioPath);

    logPipeline(projectId, "✅ Pipeline finished successfully!");
  } catch (err: any) {
    console.error("[pipeline]", err);
    await updateProject(projectId, { status: "failed", error: err.message || String(err) });
  }
}

/* ── Step 1: Prepare video (download YouTube or use file) ── */
async function prepareVideo(projectId: string, workDir: string, videoPath: string | null): Promise<string> {
  if (videoPath?.startsWith("youtube:")) {
    await updateProject(projectId, { status: "uploading" });
    const url = videoPath.replace("youtube:", "");
    const outPath = join(workDir, "video.mp4");
    logPipeline(projectId, `Downloading YouTube: ${url}`);
    await execPromise(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --extractor-args "youtube:player_client=android,ios" -o "${outPath}" "${url}" --max-filesize 500m`,
      { timeout: 5 * 60 * 1000 }
    );
    await updateProject(projectId, { videoPath: outPath });
    logPipeline(projectId, "YouTube download done.");
    return outPath;
  }
  if (!videoPath || !existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);
  return videoPath;
}

/* ── Step 2: Extract audio ── */
async function extractAudio(projectId: string, workDir: string, videoPath: string): Promise<string> {
  await updateProject(projectId, { status: "transcribing" });
  const audioPath = join(workDir, "audio.mp3");
  logPipeline(projectId, "Extracting audio...");
  await execPromise(
    `"${getFfmpegBin()}" -i "${videoPath}" -vn -acodec mp3 -ab 128k -ar 44100 -y "${audioPath}"`,
    { timeout: 5 * 60 * 1000 }
  );
  await updateProject(projectId, { audioPath });
  return audioPath;
}

/* ── Step 3: Transcribe ── */
async function performTranscription(projectId: string, audioPath: string): Promise<any[]> {
  logPipeline(projectId, "Transcribing...");
  const audioBuffer = readFileSync(audioPath);
  const segments = await transcribeAudio(audioBuffer);
  const subtitles = segments.map((seg: any) => ({
    id: uuidv4(), start: seg.start, end: seg.end, text: seg.text.trim(),
  }));
  await updateProject(projectId, { subtitles });
  return subtitles;
}

/* ── Step 4: Translate ── */
async function performTranslation(projectId: string, project: any, subtitles: any[]): Promise<any[]> {
  await updateProject(projectId, { status: "translating" });
  logPipeline(projectId, "Translating with GPT-4o...");
  const mapping = await translateText(subtitles, project.source_language, project.target_language);
  const updated = subtitles.map((sub, i) => ({
    ...sub, translatedText: mapping[i + 1] || sub.text,
  }));
  await updateProject(projectId, { subtitles: updated });
  return updated;
}

/* ── Step 5: Dubbing (TTS + time-stretch + mix) ── */
async function performDubbing(
  projectId: string,
  workDir: string,
  subtitles: any[],
  targetLang: string,
  originalAudioPath: string
): Promise<string> {
  await updateProject(projectId, { status: "dubbing" });
  const segDir = join(workDir, "segments");
  if (!existsSync(segDir)) mkdirSync(segDir, { recursive: true });

  interface SegInfo { audioPath: string; start: number; end: number }
  const segmentPaths: SegInfo[] = [];

  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    if (!sub.translatedText) continue;

    const rawPath = join(segDir, `seg_${i}_raw.mp3`);
    const finalPath = join(segDir, `seg_${i}.mp3`);

    logPipeline(projectId, `TTS seg ${i + 1}/${subtitles.length}: "${sub.translatedText.substring(0, 40)}"`);

    // Generate TTS
    await generateTTSSegment(sub.translatedText, rawPath, targetLang, projectId, i);

    // Time-stretch: fit TTS audio into original subtitle window
    const originalWindow = sub.end - sub.start; // seconds
    const ttsDuration = await getAudioDuration(rawPath);

    if (ttsDuration > 0 && originalWindow > 0.2) {
      const stretchedPath = join(segDir, `seg_${i}_stretched.mp3`);
      await stretchAudio(rawPath, stretchedPath, ttsDuration, originalWindow, projectId, i);
      // Use stretched version if it was created
      const useStretched = existsSync(stretchedPath);
      await execPromise(`"${getFfmpegBin()}" -i "${useStretched ? stretchedPath : rawPath}" -y "${finalPath}"`, { timeout: 30000 });
    } else {
      await execPromise(`"${getFfmpegBin()}" -i "${rawPath}" -y "${finalPath}"`, { timeout: 30000 });
    }

    if (existsSync(finalPath)) {
      segmentPaths.push({ audioPath: finalPath, start: sub.start, end: sub.end });
    }
  }

  if (segmentPaths.length === 0) throw new Error("No dubbed segments were generated");

  /* ── Mix: original audio at 12% (background) + dubbed voices ── */
  const dubbedAudioPath = join(workDir, "dubbed_audio.mp3");
  const inputs: string[] = ["-i", originalAudioPath];
  const filterParts: string[] = [];

  segmentPaths.forEach((seg, i) => {
    inputs.push("-i", seg.audioPath);
    const delay = Math.round(seg.start * 1000);
    filterParts.push(
      `[${i + 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay}[s${i}]`
    );
  });

  const mixInputs = segmentPaths.map((_, i) => `[s${i}]`).join("");
  const n = segmentPaths.length;

  // Background at 12% volume + dubbed voices normalized
  filterParts.push(
    `[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.12[bg];` +
    `[bg]${mixInputs}amix=inputs=${n + 1}:duration=first:dropout_transition=2,` +
    `volume=${n + 1}[mixed];` +
    `[mixed]loudnorm=I=-23:TP=-1.5:LRA=11[out]`
  );

  await runFfmpeg([
    ...inputs,
    "-filter_complex", filterParts.join(";"),
    "-map", "[out]",
    "-acodec", "libmp3lame",
    "-ar", "44100",
    "-b:a", "192k",
    "-y", dubbedAudioPath,
  ], projectId);

  await updateProject(projectId, { dubbedAudioPath });
  return dubbedAudioPath;
}

/* ── Step 6: Mux final video ── */
async function muxFinalVideo(projectId: string, workDir: string, videoPath: string, dubbedAudioPath: string): Promise<string> {
  const finalVideoPath = join(workDir, "final_dubbed.mp4");
  logPipeline(projectId, "Muxing final video...");
  await runFfmpeg([
    "-i", videoPath,
    "-i", dubbedAudioPath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-y", finalVideoPath,
  ], projectId);
  await updateProject(projectId, { finalVideoPath, status: "completed" });
  return finalVideoPath;
}
