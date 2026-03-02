import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getProject } from "../lib/supabase";
import { processPipeline } from "../lib/pipeline";

const router = Router();

// POST /api/transcribe
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const project = await getProject(projectId);
    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Start pipeline async — don't await so request returns immediately
    processPipeline(projectId).catch((err: any) => {
      console.error(`[pipeline:${projectId}] Unhandled error:`, err);
    });

    res.json({ success: true, message: "Pipeline started" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
