import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProject, updateProject } from "@/lib/store";
import { ElevenLabsClient } from "elevenlabs";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, resolve } from "path";
import ffmpegStatic from "ffmpeg-static";

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Voice IDs from ElevenLabs (free tier voices)
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — natural female voice

async function generateSpeechSegment(text: string, outputPath: string): Promise<void> {
  const audio = await eleven.generate({
    voice: VOICE_ID,
    text,
    model_id: "eleven_multilingual_v2",
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audio) {
    chunks.push(Buffer.from(chunk));
  }
  writeFileSync(outputPath, Buffer.concat(chunks));
}

async function concatAudioWithTimings(
  segments: { audioPath: string; start: number; end: number }[],
  outputPath: string
): Promise<void> {
  const duration = segments[segments.length - 1]?.end || 60;
  let filterParts: string[] = [];
  let inputs = [`-f lavfi -i anullsrc=r=44100:cl=stereo -t ${Math.ceil(duration)}`];

  segments.forEach((seg, i) => {
    inputs.push(`-i "${seg.audioPath}"`);
    const delay = Math.round(seg.start * 1000); // ms
    filterParts.push(`[${i + 1}:a]adelay=${delay}|${delay}[s${i}]`);
  });

  const mixInputs = segments.map((_, i) => `[s${i}]`).join("");
  filterParts.push(`[0:a]${mixInputs}amix=inputs=${segments.length + 1}:normalize=0[out]`);

  const inputStr = inputs.join(" ");
  const filterStr = filterParts.join(";");

  // Use resolved ffmpeg-static path
  const ffmpegBin = ffmpegStatic ? (ffmpegStatic.includes("\\ROOT\\") ? join(process.cwd(), ffmpegStatic.replace(/^\\ROOT\\/, "")) : ffmpegStatic) : "ffmpeg";

  execSync(
    `"${ffmpegBin}" ${inputStr} -filter_complex "${filterStr}" -map "[out]" -t ${Math.ceil(duration)} -y "${outputPath}"`,
    { timeout: 10 * 60 * 1000, stdio: "pipe" }
  );
}

export async function POST(req: NextRequest) {
  // Logic moved to src/lib/pipeline.ts (processPipeline)
  // This route is now just a placeholder for frontend compatibility
  return NextResponse.json({ success: true, message: "Handled by background pipeline" });
}
