import { serve } from "inngest/express";
import { Router } from "express";
import { inngest, dubbingFunction } from "../lib/inngest";

const router = Router();

// POST /api/inngest — Inngest serve handler (receives jobs from Inngest cloud)
// GET  /api/inngest — Inngest introspection (dev mode)
router.use(
  "/",
  serve({
    client: inngest,
    functions: [dubbingFunction],
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

export default router;
