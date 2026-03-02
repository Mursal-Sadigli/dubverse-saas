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
  try {
    const userId = (req as any).userId;
    const { name, sourceLanguage, targetLanguage, youtubeUrl } = req.body;

    if (!name || !sourceLanguage || !targetLanguage) {
      res.status(400).json({ error: "name, sourceLanguage, targetLanguage are required" });
      return;
    }

    let videoPath: string | undefined;
    let thumbnailUrl: string | undefined;
    let finalYoutubeUrl: string | undefined;

    if (req.file) {
      videoPath = req.file.path;
    } else if (youtubeUrl) {
      finalYoutubeUrl = youtubeUrl;
      videoPath = `youtube:${youtubeUrl}`;

      // Extract thumbnail from YouTube URL
      const match = youtubeUrl.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    } else {
      res.status(400).json({ error: "Either file or youtubeUrl is required" });
      return;
    }

    const project = await createProject({
      userId,
      name,
      sourceLanguage,
      targetLanguage,
      videoPath,
      youtubeUrl: finalYoutubeUrl,
      thumbnailUrl,
    });

    res.json({ projectId: project.id, project: mapProject(project) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
