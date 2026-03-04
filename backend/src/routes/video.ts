import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getProject } from "../lib/supabase";
import { getSignedUrl } from "../lib/storage";
import { generateSRT } from "../lib/utils";

const router = Router();

// GET /api/video/:id/srt — download SRT subtitles
router.get("/:id/srt", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const project = await getProject(req.params.id as string);

    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (!project.subtitles || project.subtitles.length === 0) {
      res.status(404).json({ error: "Subtitles not found" });
      return;
    }

    const srt = generateSRT(project.subtitles);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="subtitles_${req.params.id}.srt"`);
    res.send(srt);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/video/:id/audio — redirect to the original audio.mp3 on storage
router.get("/:id/audio", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const project = await getProject(req.params.id as string);

    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const audioPath = project.audio_path || `${req.params.id}/audio.mp3`;
    const signedUrl = await getSignedUrl(audioPath, 3600);
    res.redirect(signedUrl);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/video/:id — redirect to the final dubbed video on Supabase Storage
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const project = await getProject(req.params.id as string);

    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const videoPath = project.final_video_path;
    if (!videoPath) {
      res.status(404).json({ error: "Video file not found" });
      return;
    }

    // Redirect to a 1-hour signed URL
    const signedUrl = await getSignedUrl(videoPath, 3600);
    res.redirect(signedUrl);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
