import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getProject, getProjectsByUser, deleteProject, updateProject, mapProject } from "../lib/supabase";

const router = Router();
const id = (req: Request) => req.params.id as string;

// GET /api/projects
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await getProjectsByUser((req as any).userId);
    const projects = (rows || []).map(mapProject);
    res.json({ projects });
  } catch (err: any) { 
    console.error("[projects] List fetch error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// GET /api/projects/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await getProject(id(req));
    if (!row || row.user_id !== (req as any).userId) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapProject(row));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/projects/:id — update voice settings, etc.
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await getProject(id(req));
    if (!row || row.user_id !== (req as any).userId) { res.status(404).json({ error: "Not found" }); return; }
    const allowed = ["voiceSettings", "voiceId", "name"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
    await updateProject(id(req), updates);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects/:id/cancel
router.post("/:id/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await getProject(id(req));
    if (!row || row.user_id !== (req as any).userId) { res.status(404).json({ error: "Not found" }); return; }
    if (["completed", "failed", "cancelled"].includes(row.status)) {
      res.status(400).json({ error: `Cannot cancel — status is already: ${row.status}` }); return;
    }
    await updateProject(id(req), { status: "cancelled" });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await getProject(id(req));
    if (!row || row.user_id !== (req as any).userId) { res.status(404).json({ error: "Not found" }); return; }
    await deleteProject(id(req));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
