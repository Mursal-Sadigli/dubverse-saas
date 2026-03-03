import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load backend .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function testUsage() {
  const { data: users, error: uErr } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }
  const userId = users[0].id;

  const durationMinutes = 1;
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('minutes_used, minutes_limit')
    .eq('user_id', userId)
    .single();

  if (error) {
     console.error("Fetch subscription error:", error.message);
     return;
  }
  
  if (sub) {
    console.log(`Current usage for ${userId}: ${sub.minutes_used} / ${sub.minutes_limit}`);
    const newUsed = sub.minutes_used + durationMinutes;
    console.log(`Updating to: ${newUsed}`);
    
    const { data: updated, error: updError } = await supabase
      .from('subscriptions')
      .update({ minutes_used: newUsed })
      .eq('user_id', userId)
      .select();
      
    if (updError) {
       console.error("Update error:", updError);
    } else {
       console.log("Update success:", updated);
    }
  } else {
    console.log("No sub found for user");
  }
}

testUsage();
