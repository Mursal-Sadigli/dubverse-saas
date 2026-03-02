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

export async function processPipeline(projectId: string) {
  const workDir = join(process.cwd(), "..", "tmp", "uploads", projectId);

  try {
    if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true });
    logPipeline(projectId, "Pipeline process started.");

    const project = await getProject(projectId);
    if (!project) {
      logPipeline(projectId, "Error: Project not found in Supabase.");
      return;
    }

    if (project.status !== "uploading" && project.status !== "failed") {
      logPipeline(projectId, `Pipeline already in progress (Status: ${project.status}). Aborting.`);
      return;
    }

    // 1. Preparation
    const videoPath = await prepareVideo(projectId, workDir, project.video_path);

    // 2. Audio extraction
    const audioPath = await extractAudio(projectId, workDir, videoPath);

    // 3. Transcription
    const subtitles = await performTranscription(projectId, audioPath, project);

    // 4. Translation
    const translatedSubtitles = await performTranslation(projectId, project, subtitles);

    // 5. Dubbing (TTS)
    const dubbedAudioPath = await performDubbing(projectId, workDir, translatedSubtitles, project.target_language, audioPath);

    // 6. Final mux
    await muxFinalVideo(projectId, workDir, videoPath, dubbedAudioPath);

    logPipeline(projectId, "Pipeline finished successfully!");
  } catch (err: any) {
    console.error("[pipeline]", err);
    await updateProject(projectId, { status: "failed", error: err.message || String(err) });
  }
}

async function prepareVideo(projectId: string, workDir: string, videoPath: string | null): Promise<string> {
  if (videoPath?.startsWith("youtube:")) {
    await updateProject(projectId, { status: "uploading" });
    const url = videoPath.replace("youtube:", "");
    const outPath = join(workDir, "video.mp4");
    logPipeline(projectId, `Downloading YouTube: ${url}`);
    const cmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --extractor-args "youtube:player_client=android,ios" -o "${outPath}" "${url}" --max-filesize 500m`;
    await execPromise(cmd, { timeout: 5 * 60 * 1000 });
    await updateProject(projectId, { videoPath: outPath });
    logPipeline(projectId, "YouTube download completed.");
    return outPath;
  }

  if (!videoPath || !existsSync(videoPath)) {
    throw new Error(`Video file not found at: ${videoPath}`);
  }
  return videoPath;
}

async function extractAudio(projectId: string, workDir: string, videoPath: string): Promise<string> {
  await updateProject(projectId, { status: "transcribing" });
  const audioPath = join(workDir, "audio.mp3");
  const ffmpegBin = getFfmpegBin();
  logPipeline(projectId, "Extracting audio with FFmpeg...");
  await execPromise(`"${ffmpegBin}" -i "${videoPath}" -vn -acodec mp3 -ab 128k -ar 44100 -y "${audioPath}"`, {
    timeout: 5 * 60 * 1000,
  });
  await updateProject(projectId, { audioPath });
  logPipeline(projectId, "Audio extraction successful.");
  return audioPath;
}

async function performTranscription(projectId: string, audioPath: string, project: any): Promise<any[]> {
  logPipeline(projectId, "Starting transcription...");
  const audioBuffer = readFileSync(audioPath);
  const segments = await transcribeAudio(audioBuffer);

  const subtitles = segments.map((seg: any) => ({
    id: uuidv4(),
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
  }));

  await updateProject(projectId, { subtitles });
  return subtitles;
}

async function performTranslation(projectId: string, project: any, subtitles: any[]): Promise<any[]> {
  await updateProject(projectId, { status: "translating" });
  logPipeline(projectId, "Starting translation...");

  const mapping = await translateText(subtitles, project.source_language, project.target_language);

  const updated = subtitles.map((sub, i) => ({
    ...sub,
    translatedText: mapping[i + 1] || sub.text,
  }));

  await updateProject(projectId, { subtitles: updated });
  return updated;
}

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

  const segmentPaths: { audioPath: string; start: number; end: number }[] = [];
  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    if (!sub.translatedText) continue;
    const segPath = join(segDir, `seg_${i}.mp3`);
    logPipeline(projectId, `Generating segment ${i + 1}/${subtitles.length}: "${sub.translatedText.substring(0, 30)}..."`);
    await generateTTSSegment(sub.translatedText, segPath, targetLang, projectId, i);
    segmentPaths.push({ audioPath: segPath, start: sub.start, end: sub.end });
  }

  const dubbedAudioPath = join(workDir, "dubbed_audio.mp3");
  const filterParts: string[] = [];
  const inputs: string[] = ["-i", originalAudioPath];

  segmentPaths.forEach((seg, i) => {
    inputs.push("-i", seg.audioPath);
    const delay = Math.round(seg.start * 1000);
    filterParts.push(`[${i + 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay=${delay}|${delay}[s${i}]`);
  });

  const mixInputs = segmentPaths.map((_, i) => `[s${i}]`).join("");
  const boostFactor = (segmentPaths.length + 1) * 2;
  filterParts.push(`[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0[bg];[bg]${mixInputs}amix=inputs=${segmentPaths.length + 1}:duration=first:dropout_transition=999,volume=${boostFactor}[out]`);

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

async function muxFinalVideo(projectId: string, workDir: string, videoPath: string, dubbedAudioPath: string): Promise<string> {
  const finalVideoPath = join(workDir, "final_dubbed.mp4");
  logPipeline(projectId, "Starting final video/audio muxing...");

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
