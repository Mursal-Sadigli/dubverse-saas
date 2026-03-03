import { Router, Request, Response } from "express";
import { ElevenLabsClient } from "elevenlabs";
import { requireAuth } from "../middleware/auth";

const router = Router();
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

// GET /api/voices — list available ElevenLabs voices
router.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { voices } = await client.voices.getAll();
    const mapped = voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      gender: (v.labels as any)?.gender ?? null,
      accent: (v.labels as any)?.accent ?? null,
      previewUrl: v.preview_url,
    }));
    res.json({ voices: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
