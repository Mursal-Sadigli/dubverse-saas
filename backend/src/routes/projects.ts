import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getProject, getProjectsByUser, deleteProject, mapProject } from "../lib/supabase";

const router = Router();

// GET /api/projects — all projects for user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const rows = await getProjectsByUser(userId);
    res.json({ projects: rows.map(mapProject) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — single project
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const row = await getProject(req.params.id);
    if (!row || row.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(mapProject(row));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const row = await getProject(req.params.id);
    if (!row || row.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await deleteProject(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
