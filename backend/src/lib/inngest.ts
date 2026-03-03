import { Inngest } from "inngest";
import { processPipeline } from "./pipeline";

export const inngest = new Inngest({
  id: "dubverse-backend",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

/**
 * Inngest function: handles the full dubbing pipeline.
 * Triggered by "dubbing/process" event.
 */
export const dubbingFunction = inngest.createFunction(
  {
    id: "dubbing-process",
    name: "Video Dubbing Pipeline",
    retries: 2,
    concurrency: { limit: 3 },   // max 3 concurrent dubbing jobs
    timeouts: { finish: "30m" },  // fail after 30 minutes
  },
  { event: "dubbing/process" },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    await step.run("run-pipeline", async () => {
      await processPipeline(projectId);
    });

    return { projectId, status: "completed" };
  }
);
