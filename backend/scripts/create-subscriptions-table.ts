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

async function createTable() {
  console.log("Attempting to create 'subscriptions' table via RPC or direct SQL...");
  
  // Actually, supabase JS client doesn't support raw DDL exec directly without an RPC function
  // So we will just use the REST API via a generic fetch if possible, or tell the user to run it.
  
  // Since we require DDL, let's create a temporary POST request to postgres-meta or rest
  console.log(`
Please run the following SQL command in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id        TEXT PRIMARY KEY,
  plan           TEXT DEFAULT 'free',
  minutes_used   INTEGER DEFAULT 0,
  minutes_limit  INTEGER DEFAULT 20,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
`);
}

createTable();
