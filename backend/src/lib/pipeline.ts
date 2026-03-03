import { getProject, updateProject, supabase } from "./supabase";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { logPipeline, runFfmpeg, getFfmpegBin } from "./ffmpeg";
import { generateTTSSegment } from "./tts";
import { transcribeAudio, translateText } from "./ai";
import { emitProgress } from "./emitter";
import { uploadFile } from "./storage";

const execPromise = promisify(exec);

async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const ffmpegBin = getFfmpegBin();
    const ffprobeBin = ffmpegBin.replace(/ffmpeg(\.exe)?$/, "ffprobe$1");
    const { stdout } = await execPromise(
      `"${existsSync(ffprobeBin) ? ffprobeBin : "ffprobe"}" -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { timeout: 30000 }
    );
    return parseFloat(stdout.trim()) || 0;
  } catch { return 0; }
}

async function stretchAudio(inputPath: string, outputPath: string, src: number, tgt: number, projectId: string, i: number): Promise<void> {
  if (src <= 0 || tgt <= 0) return;
  const rate = Math.max(0.5, Math.min(2.0, src / tgt));
  if (Math.abs(rate - 1.0) < 0.05) return;
  logPipeline(projectId, `Stretching seg ${i}: ${src.toFixed(2)}s→${tgt.toFixed(2)}s (rate=${rate.toFixed(2)})`);
  await execPromise(`"${getFfmpegBin()}" -i "${inputPath}" -filter:a "atempo=${rate}" -y "${outputPath}"`, { timeout: 60000 });
}

/* Check if project was cancelled between steps */
async function checkCancelled(projectId: string): Promise<boolean> {
  const p = await getProject(projectId);
  return p?.status === "cancelled";
}

/* ─────────────────────────────────────────────── */
export async function processPipeline(projectId: string) {
  const workDir = join(process.cwd(), "..", "tmp", "uploads", projectId);

  try {
    if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true });
    logPipeline(projectId, "Pipeline started.");
    emitProgress(projectId, { step: "uploading", percent: 5, message: "Pipeline başladıldı" });

    const project = await getProject(projectId);
    if (!project) { logPipeline(projectId, "Project not found."); return; }
    if (project.status !== "uploading" && project.status !== "failed") {
      logPipeline(projectId, `Already running (${project.status}). Aborted.`);
      return;
    }

    // Step 1: Prepare video
    emitProgress(projectId, { step: "uploading", percent: 10, message: "Video hazırlanır..." });
    const videoPath = await prepareVideo(projectId, workDir, project.video_path);
    if (await checkCancelled(projectId)) return;

    // Step 2: Extract audio
    emitProgress(projectId, { step: "transcribing", percent: 22, message: "Audio çıxarılır..." });
    const audioPath = await extractAudio(projectId, workDir, videoPath);
    if (await checkCancelled(projectId)) return;

    // Step 3: Check Duration & Deduct Minutes
    emitProgress(projectId, { step: "transcribing", percent: 25, message: "Kredit yoxlanılır..." });
    const durationSeconds = await getAudioDuration(audioPath);
    const durationMinutes = Math.ceil(durationSeconds / 60);
    
    if (durationMinutes > 0) {
       let sub = null;
       const { data, error } = await supabase.from('subscriptions').select('minutes_used, minutes_limit').eq('user_id', project.user_id).maybeSingle();
       
       if (error && error.code !== 'PGRST116') {
         console.error("Supabase subscription fetch error:", error);
       } else if (data) {
         sub = data;
       }

       if (!sub) {
         // Create default free tier if missing
         sub = { minutes_used: 0, minutes_limit: 20 };
       }

       const newUsed = sub.minutes_used + durationMinutes;
       if (newUsed > sub.minutes_limit) {
          throw new Error(`Kifayət qədər limit yoxdur. Bu video üçün ${durationMinutes} dəqiqə lazımdır, lakin sizin ${sub.minutes_limit - sub.minutes_used} dəqiqəniz qalıb.`);
       }
       
       await supabase.from('subscriptions').upsert({ 
         user_id: project.user_id, 
         plan: sub.minutes_limit > 20 ? 'pro' : 'free',
         minutes_used: newUsed,
         minutes_limit: sub.minutes_limit,
         updated_at: new Date().toISOString(),
       }, { onConflict: 'user_id' });
    }
    if (await checkCancelled(projectId)) return;

    // Step 4: Transcribe
    emitProgress(projectId, { step: "transcribing", percent: 35, message: "Transkripsiya edilir..." });
    const subtitles = await performTranscription(projectId, audioPath);
    if (await checkCancelled(projectId)) return;

    // Step 4: Translate
    emitProgress(projectId, { step: "translating", percent: 55, message: "Tərcümə edilir (GPT-4o)..." });
    const translatedSubs = await performTranslation(projectId, project, subtitles);
    if (await checkCancelled(projectId)) return;

    // Step 5: Dub
    emitProgress(projectId, { step: "dubbing", percent: 70, message: "Dublaj səsləri yaradılır..." });
    const dubbedAudioPath = await performDubbing(projectId, workDir, translatedSubs, project.target_language, audioPath, project.voice_id);
    if (await checkCancelled(projectId)) return;

    // Step 6: Mux
    emitProgress(projectId, { step: "dubbing", percent: 90, message: "Video birləşdirilir..." });
    await muxFinalVideo(projectId, workDir, videoPath, dubbedAudioPath);

    emitProgress(projectId, { step: "completed", percent: 100, message: "Tamamlandı! 🎉" });
    logPipeline(projectId, "✅ Pipeline finished successfully!");
  } catch (err: any) {
    console.error("[pipeline]", err);
    emitProgress(projectId, { step: "failed", percent: 0, message: err.message || "Xəta baş verdi" });
    await updateProject(projectId, { status: "failed", error: err.message || String(err) });
  }
}

async function prepareVideo(projectId: string, workDir: string, videoPath: string | null): Promise<string> {
  if (videoPath?.startsWith("youtube:")) {
    await updateProject(projectId, { status: "uploading" });
    const url = videoPath.replace("youtube:", "");
    const outPath = join(workDir, "video.mp4");
    logPipeline(projectId, `Downloading YouTube: ${url}`);
    emitProgress(projectId, { step: "uploading", percent: 15, message: "YouTube yüklənir..." });
    await execPromise(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --extractor-args "youtube:player_client=android,ios" -o "${outPath}" "${url}" --max-filesize 500m`,
      { timeout: 5 * 60 * 1000 }
    );
    emitProgress(projectId, { step: "uploading", percent: 18, message: "Storage-a yüklənir..." });
    const storagePath = `${projectId}/video.mp4`;
    await uploadFile(outPath, storagePath);
    await updateProject(projectId, { videoPath: storagePath });
    return outPath;
  }
  if (!videoPath || !existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);
  return videoPath;
}

async function extractAudio(projectId: string, workDir: string, videoPath: string): Promise<string> {
  await updateProject(projectId, { status: "transcribing" });
  const audioPath = join(workDir, "audio.mp3");
  await execPromise(
    `"${getFfmpegBin()}" -i "${videoPath}" -vn -acodec mp3 -ab 128k -ar 44100 -y "${audioPath}"`,
    { timeout: 5 * 60 * 1000 }
  );
  emitProgress(projectId, { step: "transcribing", percent: 25, message: "Audio storage-a yüklənir..." });
  const storagePath = `${projectId}/audio.mp3`;
  await uploadFile(audioPath, storagePath);
  await updateProject(projectId, { audioPath: storagePath });
  return audioPath;
}

async function performTranscription(projectId: string, audioPath: string): Promise<any[]> {
  const audioBuffer = readFileSync(audioPath);
  const segments = await transcribeAudio(audioBuffer);
  const subtitles = segments.map((seg: any) => ({
    id: uuidv4(), start: seg.start, end: seg.end, text: seg.text.trim(),
  }));
  await updateProject(projectId, { subtitles });
  return subtitles;
}

async function performTranslation(projectId: string, project: any, subtitles: any[]): Promise<any[]> {
  await updateProject(projectId, { status: "translating" });
  const mapping = await translateText(subtitles, project.source_language, project.target_language);
  const updated = subtitles.map((sub, i) => ({ ...sub, translatedText: mapping[i + 1] || sub.text }));
  await updateProject(projectId, { subtitles: updated });
  return updated;
}

async function performDubbing(
  projectId: string, workDir: string, subtitles: any[],
  targetLang: string, originalAudioPath: string, voiceId?: string
): Promise<string> {
  await updateProject(projectId, { status: "dubbing" });
  const segDir = join(workDir, "segments");
  if (!existsSync(segDir)) mkdirSync(segDir, { recursive: true });

  interface SegInfo { audioPath: string; start: number; end: number }
  const segmentPaths: SegInfo[] = [];
  const total = subtitles.filter(s => s.translatedText).length;

  for (let i = 0, done = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    if (!sub.translatedText) continue;

    const rawPath = join(segDir, `seg_${i}_raw.mp3`);
    const finalPath = join(segDir, `seg_${i}.mp3`);

    done++;
    const pct = 70 + Math.round((done / total) * 18);
    emitProgress(projectId, { step: "dubbing", percent: pct, message: `TTS: ${done}/${total} segment` });

    await generateTTSSegment(sub.translatedText, rawPath, targetLang, projectId, i, voiceId);

    const originalWindow = sub.end - sub.start;
    const ttsDuration = await getAudioDuration(rawPath);

    if (ttsDuration > 0 && originalWindow > 0.2) {
      const stretchedPath = join(segDir, `seg_${i}_stretched.mp3`);
      await stretchAudio(rawPath, stretchedPath, ttsDuration, originalWindow, projectId, i);
      const src = existsSync(stretchedPath) ? stretchedPath : rawPath;
      await execPromise(`"${getFfmpegBin()}" -i "${src}" -y "${finalPath}"`, { timeout: 30000 });
    } else {
      await execPromise(`"${getFfmpegBin()}" -i "${rawPath}" -y "${finalPath}"`, { timeout: 30000 });
    }

    if (existsSync(finalPath)) segmentPaths.push({ audioPath: finalPath, start: sub.start, end: sub.end });
  }

  if (segmentPaths.length === 0) throw new Error("No dubbed segments were generated");

  const dubbedAudioPath = join(workDir, "dubbed_audio.mp3");
  const inputs: string[] = ["-i", originalAudioPath];
  const filterParts: string[] = [];

  segmentPaths.forEach((seg, i) => {
    inputs.push("-i", seg.audioPath);
    const delay = Math.round(seg.start * 1000);
    filterParts.push(`[${i + 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay}[s${i}]`);
  });

  const mixInputs = segmentPaths.map((_, i) => `[s${i}]`).join("");
  const n = segmentPaths.length;
  filterParts.push(
    `[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0[bg];` +
    `[bg]${mixInputs}amix=inputs=${n + 1}:duration=first:dropout_transition=2,volume=${n + 1}[mixed];` +
    `[mixed]loudnorm=I=-23:TP=-1.5:LRA=11[out]`
  );

  await runFfmpeg([
    ...inputs, "-filter_complex", filterParts.join(";"),
    "-map", "[out]", "-acodec", "libmp3lame", "-ar", "44100", "-b:a", "192k", "-y", dubbedAudioPath,
  ], projectId);

  emitProgress(projectId, { step: "dubbing", percent: 88, message: "Dublaj storage-a yüklənir..." });
  const storagePath = `${projectId}/dubbed_audio.mp3`;
  await uploadFile(dubbedAudioPath, storagePath);
  await updateProject(projectId, { dubbedAudioPath: storagePath });
  return dubbedAudioPath;
}

async function muxFinalVideo(projectId: string, workDir: string, videoPath: string, dubbedAudioPath: string): Promise<string> {
  const finalVideoPath = join(workDir, "final_dubbed.mp4");
  await runFfmpeg([
    "-i", videoPath, "-i", dubbedAudioPath,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-y", finalVideoPath,
  ], projectId);
  
  emitProgress(projectId, { step: "dubbing", percent: 95, message: "Final video storage-a yüklənir..." });
  const storagePath = `${projectId}/final_dubbed.mp4`;
  await uploadFile(finalVideoPath, storagePath);
  await updateProject(projectId, { finalVideoPath: storagePath, status: "completed" });
  return finalVideoPath;
}
