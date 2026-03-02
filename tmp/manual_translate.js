const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) { process.env[k] = envConfig[k]; }

const STORE_PATH = path.join(process.cwd(), 'tmp', 'db', 'projects.json');
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function runTranslation(projectId) {
  console.log("Loading project:", projectId);
  const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  const project = data.projects[projectId];
  
  if (!project) throw new Error("Project not found");
  
  console.log("Translating subtitles:", project.subtitles.length);
  const subtitleTexts = project.subtitles.map((s, i) => `[${i + 1}] ${s.text}`).join("\n");
  
  try {
    const response = await grok.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Translate the numbered subtitle segments. Output ONLY [1] translated text...",
        },
        { role: "user", content: subtitleTexts },
      ],
      temperature: 0.3,
    });
    
    console.log("Response received!");
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

// Use the ID from projects.json
runTranslation("dee75290-5ff3-4bab-926e-13a34e510462");
