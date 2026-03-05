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
import billingRouter, { stripeWebhookHandler } from "./routes/billing";
import inngestRouter from "./routes/inngest";

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://dubversee.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Remove trailing slashes and lowercase for robust matching
const normalizedOrigins = allowedOrigins.map(origin => 
  origin.toLowerCase().replace(/\/$/, "")
);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");
    if (normalizedOrigins.includes(normalizedOrigin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}. Allowed: ${normalizedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ── Raw body routes (must be BEFORE express.json) ──────────
// Svix (Clerk) webhook needs raw body
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRouter);

// Stripe webhook needs raw body and MUST be handled before express.json()
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

// ── JSON middleware + Clerk ─────────────────────────────────
app.use(express.json());
app.use(clerkMiddleware());

// ── API Routes ──────────────────────────────────────────────
app.use("/api/projects", projectsRouter);   // GET, POST cancel, DELETE
app.use("/api/projects", eventsRouter);     // GET /:id/events (SSE)
app.use("/api/upload", uploadRouter);
app.use("/api/transcribe", transcribeRouter);
app.use("/api/export", exportRouter);
app.use("/api/video", videoRouter);
app.use("/api/subtitles", subtitlesRouter);
app.use("/api/voices", voicesRouter);
app.use("/api/billing", billingRouter);      // GET /usage, POST /checkout
app.use("/api/inngest", inngestRouter); // Inngest serve handler

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`✅ Dubverse backend running on http://localhost:${PORT}`);
  if (process.env.INNGEST_EVENT_KEY) {
    console.log("⚡ Inngest queue enabled");
  } else {
    console.log("ℹ️  Inngest not configured — running pipeline directly");
  }
});

export default app;
