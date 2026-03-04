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

    console.log(`[TRANSCRIBE] Request from userId: ${userId} for projectId: ${projectId}`);

    if (!projectId) { res.status(400).json({ error: "projectId is required" }); return; }

    const project = await getProject(projectId);
    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" }); return;
    }

    // Logic to decide whether to use Inngest or run directly
    const useInngest = !!process.env.INNGEST_EVENT_KEY && 
                       process.env.NODE_ENV === "production" && 
                       process.env.FORCE_DIRECT_PIPELINE !== "true";

    if (useInngest) {
      console.log(`[PIPELINE:${projectId}] Mode: Inngest (Production)`);
      const { inngest } = await import("../lib/inngest");
      await inngest.send({ name: "dubbing/process", data: { projectId } });
      res.json({ success: true, message: "Job queued via Inngest", queued: true });
    } else {
      const mode = process.env.NODE_ENV === "production" ? "Direct (Bypass)" : "Direct (Local)";
      console.log(`[PIPELINE:${projectId}] Mode: ${mode}`);
      // Direct async execution
      processPipeline(projectId).catch((err: any) => {
        console.error(`[PIPELINE ERROR:${projectId}]`, err);
      });
      res.json({ success: true, message: `Pipeline started directly (${mode})`, queued: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
