import { Router, Request, Response } from "express";
import { getProject } from "../lib/supabase";
import { pipelineEmitter, ProgressEvent } from "../lib/emitter";

const router = Router();

function extractUserIdFromToken(token: string): string | null {
  try {
    // Clerk JWTs are standard signed JWTs — decode payload without verifying
    // (verification happens at middleware layer for all other routes)
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

// GET /api/projects/:id/events — SSE stream
// EventSource cannot send Authorization header, so we accept ?token= query param
router.get("/:id/events", async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

    const userId = extractUserIdFromToken(token);
    if (!userId) { res.status(401).json({ error: "Invalid token" }); return; }

    const project = await getProject(req.params.id as string);
    if (!project || project.user_id !== userId) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (data: ProgressEvent) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send padding to bypass proxy buffering (e.g. Nginx, Render)
    res.write(`: ${' '.repeat(2048)}\n\n`);

    // Send initial status right away
    sendEvent({ step: project.status, percent: 0, message: "Bağlantı quruldu" });

    // Heartbeat every 15s
    const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 15000);
    const eventKey = `progress:${req.params.id}`;
    pipelineEmitter.on(eventKey, sendEvent);

    req.on("close", () => {
      clearInterval(heartbeat);
      pipelineEmitter.off(eventKey, sendEvent);
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
