import { Router, Request, Response } from "express";
import { createReadStream, existsSync, readFileSync } from "fs";
import { requireAuth } from "../middleware/auth";
import { getProject } from "../lib/supabase";

const router = Router();

// GET /api/export?projectId=xxx&format=mp4|audio|srt
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { projectId, format } = req.query as { projectId: string; format: string };

    if (!projectId || !format) {
      res.status(400).json({ error: "projectId and format are required" });
      return;
    }

    const project = await getProject(projectId);
    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (format === "mp4") {
      const filePath = project.final_video_path;
      if (!filePath) {
        res.status(404).json({ error: "Video file not found" });
        return;
      }
      const { getSignedUrl } = await import("../lib/storage");
      const signedUrl = await getSignedUrl(filePath, 600); // 10 min
      res.redirect(signedUrl);
    } else if (format === "audio") {
      const filePath = project.dubbed_audio_path;
      if (!filePath) {
        res.status(404).json({ error: "Audio file not found" });
        return;
      }
      const { getSignedUrl } = await import("../lib/storage");
      const signedUrl = await getSignedUrl(filePath, 600); // 10 min
      res.redirect(signedUrl);
    } else if (format === "srt") {
      // Generate SRT content from subtitles
      const { data: subs } = await (await import("../lib/supabase")).supabase
        .from("subtitles")
        .select("*")
        .eq("project_id", projectId)
        .order("position");

      if (!subs || !subs.length) {
        res.status(404).json({ error: "No subtitles found" });
        return;
      }

      const toSrtTime = (s: number) => {
        const date = new Date(s * 1000);
        const h = String(date.getUTCHours()).padStart(2, "0");
        const m = String(date.getUTCMinutes()).padStart(2, "0");
        const sec = String(date.getUTCSeconds()).padStart(2, "0");
        const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
        return `${h}:${m}:${sec},${ms}`;
      };

      const srtContent = subs
        .map((sub: any, i: number) =>
          `${i + 1}\n${toSrtTime(sub.start_time)} --> ${toSrtTime(sub.end_time)}\n${sub.translated_text || sub.text}\n`
        )
        .join("\n");

      res.setHeader("Content-Disposition", `attachment; filename="${project.name}.srt"`);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(srtContent);
    } else {
      res.status(400).json({ error: `Unsupported format: ${format}` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
