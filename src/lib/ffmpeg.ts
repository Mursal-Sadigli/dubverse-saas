import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import { join } from "path";
import { existsSync, mkdirSync, appendFileSync } from "fs";

export function getFfmpegBin(): string {
  let bin = ffmpegStatic;
  if (!bin) return "ffmpeg";
  if (bin.includes("\\ROOT\\")) {
    bin = join(process.cwd(), bin.replace(/^\\ROOT\\/, ""));
  }
  return bin;
}

export function logPipeline(projectId: string, message: string) {
  try {
    const workDir = join(process.cwd(), "tmp", "uploads", projectId);
    if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true });
    
    const logPath = join(workDir, "pipeline.log");
    const timestamp = new Date().toISOString();
    appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    console.log(`[pipeline:${projectId}] ${message}`);
  } catch (e) {
    console.error(`[CRITICAL] Logging failed for ${projectId}:`, e);
  }
}

export async function runFfmpeg(args: string[], projectId: string): Promise<void> {
  const ffmpegBin = getFfmpegBin();
  logPipeline(projectId, `Running FFmpeg: ${ffmpegBin} ${args.join(" ")}`);
  
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin, ["-nostdin", "-hide_banner", ...args]);
    
    child.stdout.on("data", (data) => logPipeline(projectId, `FFmpeg Out: ${data}`));
    child.stderr.on("data", (data) => logPipeline(projectId, `FFmpeg Err: ${data}`));
    
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed with code ${code}`));
    });
    
    child.on("error", (err) => reject(err));
  });
}
