import "dotenv/config";
import { supabase, mapProject } from "./src/lib/supabase";

async function checkProject() {
  const { data, error } = await supabase
    .from("projects")
    .select("*, subtitles(*)")
    .ilike("name", "%zuck%")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching project:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No project found with name 'zuck'");
    return;
  }

  const project = mapProject(data[0]);
  console.log("Project Details:");
  console.log(JSON.stringify(project, null, 2));
}

checkProject();
