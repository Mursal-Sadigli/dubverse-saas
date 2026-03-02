const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) { process.env[k] = envConfig[k]; }

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

async function test() {
  console.log("Testing ElevenLabs API key...");
  console.log("Key length:", process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.length : 0);
  console.log("Key starts with:", process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.substring(0, 3) : "N/A");
  
  try {
    const user = await eleven.user.getSubscription();
    console.log("Success! Account tier:", user.tier);
  } catch (err) {
    console.error("Error:", err.message || err);
    if (err.statusCode) console.log("Status Code:", err.statusCode);
    if (err.body) console.log("Body:", err.body);
  }
}

test();
