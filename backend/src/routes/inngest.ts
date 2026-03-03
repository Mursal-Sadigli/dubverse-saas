import { serve } from "inngest/express";
import { inngest, dubbingFunction } from "../lib/inngest";
import { Router } from "express";

const router = Router();

// Define the Inngest endpoint
router.use(
  "/",
  serve({
    client: inngest,
    functions: [dubbingFunction],
  })
);

export default router;
