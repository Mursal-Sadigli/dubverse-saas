import { Router, Request, Response } from "express";
import { createReadStream, statSync, existsSync } from "fs";
import { requireAuth } from "../middleware/auth";
import { getProject } from "../lib/supabase";

const router = Router();

// GET /api/video/:id — stream the final dubbed video
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const project = await getProject(req.params.id);

    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const videoPath = project.final_video_path;
    if (!videoPath || !existsSync(videoPath)) {
      res.status(404).json({ error: "Video file not found" });
      return;
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });
      createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      createReadStream(videoPath).pipe(res);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
