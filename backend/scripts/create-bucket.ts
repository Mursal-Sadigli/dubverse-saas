import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load backend .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  console.log("Attempting to create 'dubverse-videos' bucket without size limit...");
  
  // Create bucket without fileSizeLimit
  const { data, error } = await supabase.storage.createBucket('dubverse-videos', {
    public: false,
    allowedMimeTypes: ['video/mp4', 'audio/mp3', 'audio/mpeg', 'video/webm']
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate key value')) {
      console.log("✅ Bucket 'dubverse-videos' already exists.");
    } else {
      console.error("❌ Error creating bucket:", error);
      process.exit(1);
    }
  } else {
    console.log("✅ Successfully created 'dubverse-videos' bucket:", data);
  }
}

createBucket();
