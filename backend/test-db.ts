import "dotenv/config";
import { supabase } from "./src/lib/supabase";

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from("projects").select("count").limit(1);
  if (error) {
    console.error("Connection failed:", error);
  } else {
    console.log("Connection successful! Data:", data);
  }
}

test();
