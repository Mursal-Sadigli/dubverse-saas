const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function test() {
  console.log("Testing Groq.com API...");
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say hello in one word." }],
      max_tokens: 10,
    });
    console.log("Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
