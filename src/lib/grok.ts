import OpenAI from "openai";

// This client can support both xAI (Grok) and Groq.com (with Q)
// The user provided a Groq.com key, so we'll use their fast inference engine.
export function getGrokClient() {
  return new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const grok = getGrokClient();
export default grok;
