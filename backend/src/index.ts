import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import webhooksRouter from "./routes/webhooks";
import projectsRouter from "./routes/projects";
import uploadRouter from "./routes/upload";
import transcribeRouter from "./routes/transcribe";
import exportRouter from "./routes/export";
import videoRouter from "./routes/video";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// ⚠️ Webhook route must be mounted BEFORE express.json()
// svix needs the raw body to verify the signature
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

// Regular middleware
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use("/api/projects", projectsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/transcribe", transcribeRouter);
app.use("/api/export", exportRouter);
app.use("/api/video", videoRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Dubverse backend running on http://localhost:${PORT}`);
});

export default app;
