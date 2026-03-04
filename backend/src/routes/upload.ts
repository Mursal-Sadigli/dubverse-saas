import { Router, Request, Response } from "express";
import multer from "multer";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth";
import { createProject, mapProject } from "../lib/supabase";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = join(process.cwd(), "..", "tmp", "uploads");
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Only video files are allowed"));
  },
});

// POST /api/upload
router.post("/", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  let localFilePath: string | undefined;
  try {
    const userId = (req as any).userId;
    const { name, sourceLanguage, targetLanguage, youtubeUrl, voiceId } = req.body;

    if (!name || !sourceLanguage || !targetLanguage) {
      res.status(400).json({ error: "name, sourceLanguage, targetLanguage are required" });
      return;
    }

    localFilePath = req.file?.path;

    // 1. Create the project entry first to get an ID
    const project = await createProject({
      userId,
      name,
      sourceLanguage,
      targetLanguage,
      voiceId,
      youtubeUrl,
    });

    let videoPath: string | undefined;
    let thumbnailUrl: string | undefined;

    // 2. Handle the media
    if (req.file) {
      const { uploadFile } = await import("../lib/storage");
      const { unlink } = await import("fs/promises");
      
      // Define a clean storage path: project_id/video.mp4
      const storagePath = `${project.id}/video.mp4`;
      
      console.log(`[UPLOAD] Persisting local file ${req.file.path} to storage: ${storagePath}`);
      await uploadFile(req.file.path, storagePath);
      
      videoPath = storagePath;
      
      // Cleanup local temp file
      await unlink(req.file.path).catch(err => console.error("[UPLOAD] Temp file cleanup failed:", err));
      localFilePath = undefined; // marked as deleted
    } else if (youtubeUrl) {
      videoPath = `youtube:${youtubeUrl}`;
      const match = youtubeUrl.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }

    // 3. Update project with final paths
    const { updateProject } = await import("../lib/supabase");
    await updateProject(project.id, { videoPath, thumbnailUrl });

    res.json({ projectId: project.id, message: "Project created and media persisted" });
  } catch (err: any) {
    console.error("[UPLOAD ERROR]", err);
    // Cleanup local file if it still exists on error
    if (localFilePath && existsSync(localFilePath)) {
       const { unlinkSync } = await import("fs");
       try { unlinkSync(localFilePath); } catch {}
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
