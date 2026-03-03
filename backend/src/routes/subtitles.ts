import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { supabase } from "../lib/supabase";

const router = Router();

// PATCH /api/subtitles/:id — update a single subtitle
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, translatedText } = req.body;
    const { error } = await supabase
      .from("subtitles")
      .update({
        ...(text !== undefined && { text }),
        ...(translatedText !== undefined && { translated_text: translatedText }),
      })
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
