import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import webhooksRouter from "./routes/webhooks";
import projectsRouter from "./routes/projects";
import eventsRouter from "./routes/events";
import uploadRouter from "./routes/upload";
import transcribeRouter from "./routes/transcribe";
import exportRouter from "./routes/export";
import videoRouter from "./routes/video";
import subtitlesRouter from "./routes/subtitles";
import voicesRouter from "./routes/voices";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Webhook route before express.json() (svix needs raw body)
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use("/api/projects", projectsRouter);   // includes /:id/cancel via projectsRouter
app.use("/api/projects", eventsRouter);      // GET /:id/events (SSE)
app.use("/api/upload", uploadRouter);
app.use("/api/transcribe", transcribeRouter);
app.use("/api/export", exportRouter);
app.use("/api/video", videoRouter);
app.use("/api/subtitles", subtitlesRouter);
app.use("/api/voices", voicesRouter);

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`✅ Dubverse backend running on http://localhost:${PORT}`);
});

export default app;
