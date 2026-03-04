import "dotenv/config";
import { processPipeline } from "./src/lib/pipeline";

async function runManually() {
  const projectId = "677bf374-2fe1-4796-9051-1185012557ce"; // Project zuck
  console.log(`[DEBUG] Manually triggering pipeline for ${projectId}...`);
  try {
    await processPipeline(projectId);
    console.log("[DEBUG] Pipeline finished successfully!");
  } catch (err) {
    console.error("[DEBUG] Pipeline failed:", err);
  }
}

runManually();
