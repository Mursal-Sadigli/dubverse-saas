import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecent() {
  const { data, error } = await supabase
    .from("projects")
    .select("status, id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) { console.error(error); return; }
  
  data?.forEach(p => {
    console.log(`Project: ${p.name} (${p.id}) - Status: ${p.status}`);
  });
}

checkRecent();
