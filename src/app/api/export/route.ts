import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProject } from "@/lib/store";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import ffmpegStatic from "ffmpeg-static";

function getFfmpegBin() {
  let bin = ffmpegStatic;
  if (!bin) return "ffmpeg";
  if (bin.includes("\\ROOT\\")) {
    bin = join(process.cwd(), bin.replace(/^\\ROOT\\/, ""));
  }
  return bin;
}

function toSRT(subtitles: { start: number; end: number; translatedText?: string; text: string }[]): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toTimecode = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.round((s % 1) * 1000);
    return `${pad(h)}:${pad(m)}:${pad(sec)},${String(ms).padStart(3, "0")}`;
  };

  return subtitles
    .map((sub, i) => `${i + 1}\n${toTimecode(sub.start)} --> ${toTimecode(sub.end)}\n${sub.translatedText || sub.text}`)
    .join("\n\n");
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const format = searchParams.get("format") || "mp4";

  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const project = getProject(projectId);
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workDir = join(process.cwd(), "tmp", "uploads", projectId);

  if (format === "srt") {
    const srtContent = toSRT(project.subtitles);
    return new NextResponse(srtContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, "_")}.srt"`,
      },
    });
  }

  if (format === "audio") {
    const audioPath = project.dubbedAudioPath;
    if (!audioPath || !existsSync(audioPath)) {
      return NextResponse.json({ error: "Audio not ready" }, { status: 404 });
    }
    const file = readFileSync(audioPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, "_")}_dubbed.mp3"`,
      },
    });
  }

  if (format === "mp4") {
    const videoPath = project.videoPath;
    const dubbedAudioPath = project.dubbedAudioPath;

    if (!videoPath || !dubbedAudioPath || !existsSync(dubbedAudioPath)) {
      return NextResponse.json({ error: "Video not ready" }, { status: 404 });
    }

    const outputPath = join(workDir, "final_dubbed.mp4");
    const ffmpegBin = getFfmpegBin();

    // Mux original video with dubbed audio
    execSync(
      `"${ffmpegBin}" -i "${videoPath}" -i "${dubbedAudioPath}" -map 0:v -map 1:a -c:v copy -shortest -y "${outputPath}"`,
      { timeout: 10 * 60 * 1000, stdio: "pipe" }
    );

    const file = readFileSync(outputPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, "_")}_dubbed.mp4"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
