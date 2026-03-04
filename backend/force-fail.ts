import "dotenv/config";
import { updateProject } from "./src/lib/supabase";

async function forceFail() {
  const projectId = "677bf374-2fe1-4796-9051-1185012557ce";
  console.log(`Force failing project ${projectId}...`);
  try {
    await updateProject(projectId, { status: "failed", error: "Sistem tərəfindən dayandırıldı. Zəhmət olmasa yenidən cəhd edin." });
    console.log("Success!");
  } catch (err) {
    console.error("Failed:", err);
  }
}

forceFail();
