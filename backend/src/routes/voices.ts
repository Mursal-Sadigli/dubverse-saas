import { Router, Request, Response } from "express";
import { ElevenLabsClient } from "elevenlabs";
import { requireAuth } from "../middleware/auth";

const router = Router();
const OPENAI_VOICES = [
  { id: "nova", name: "Nova", gender: "female", category: "OpenAI" },
  { id: "alloy", name: "Alloy", gender: "neutral", category: "OpenAI" },
  { id: "shimmer", name: "Shimmer", gender: "female", category: "OpenAI" },
  { id: "echo", name: "Echo", gender: "male", category: "OpenAI" },
  { id: "onyx", name: "Onyx", gender: "male", category: "OpenAI" },
  { id: "fable", name: "Fable", gender: "neutral", category: "OpenAI" },
];

// GET /api/voices — list available OpenAI voices
router.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json({ voices: OPENAI_VOICES });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
