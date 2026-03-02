import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { setProject } from "@/lib/store";
import { Project } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const sourceLanguage = formData.get("sourceLanguage") as string;
    const targetLanguage = formData.get("targetLanguage") as string;
    const file = formData.get("file") as File | null;
    const youtubeUrl = formData.get("youtubeUrl") as string | null;

    if (!name || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const projectId = uuidv4();
    let videoPath: string | undefined;

    if (file) {
      // Save uploaded file
      const uploadDir = join(process.cwd(), "tmp", "uploads", projectId);
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      videoPath = join(uploadDir, file.name.replace(/[^a-zA-Z0-9._-]/g, "_"));
      await writeFile(videoPath, buffer);
    } else if (youtubeUrl) {
      // Mark for YouTube download — will be processed in transcribe step
      videoPath = `youtube:${youtubeUrl}`;
    } else {
      return NextResponse.json({ error: "No file or YouTube URL provided" }, { status: 400 });
    }

    const project: Project = {
      id: projectId,
      name,
      userId,
      status: "uploading",
      sourceLanguage,
      targetLanguage,
      videoPath,
      subtitles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(youtubeUrl ? { youtubeUrl } : {}),
    };

    setProject(project);

    return NextResponse.json({ projectId, status: "uploading" });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
