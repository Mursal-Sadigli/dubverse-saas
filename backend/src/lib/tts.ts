import { createWriteStream, existsSync, statSync } from "fs";
import { logPipeline } from "./ffmpeg";

// Default fallback voice (Nova is very natural and clear)
const DEFAULT_VOICE_ID = "nova";

export async function generateTTSSegment(
  text: string,
  outputPath: string,
  lang: string,
  projectId: string,
  index: number,
  voiceId?: string
): Promise<void> {
  const selectedVoice = voiceId || DEFAULT_VOICE_ID;
  const apiKey = process.env.OPENAI_API_KEY;

  console.log(`[TTS:${projectId}] Seg ${index}: Requesting voice "${selectedVoice}" for text: "${text.substring(0, 30)}..."`);
  logPipeline(projectId, `TTS seg ${index} [${selectedVoice}]: "${text.substring(0, 50)}"`);

  let lastOpenAIError = "";

  // Attempt 1: OpenAI (Premium Quality)
  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1-hd",
          input: text,
          voice: selectedVoice,
          response_format: "mp3",
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        await saveBufferToFile(Buffer.from(arrayBuffer), outputPath);
        console.log(`[TTS:${projectId}] Seg ${index} SUCCESS (OpenAI - ${selectedVoice})`);
        return;
      } else {
        const errJson = await response.json().catch(() => ({ error: { message: "OpenAI unknown error" } }));
        lastOpenAIError = errJson.error?.message || `Status ${response.status}`;
        console.error(`[TTS:${projectId}] Seg ${index} OpenAI FAILED: ${lastOpenAIError}`);
        logPipeline(projectId, `⚠️ OpenAI failed: ${lastOpenAIError}, trying Google fallback...`);
      }
    } catch (err: any) {
      lastOpenAIError = err.message;
      console.error(`[TTS:${projectId}] Seg ${index} OpenAI Exception:`, err.message);
      logPipeline(projectId, `⚠️ OpenAI exception, trying Google fallback...`);
    }
  }

  // Attempt 2: Google Translate TTS (100% Free Fallback)
  try {
    const cleanText = text.substring(0, 200).replace(/["']/g, ""); // Limit length and clean
    console.log(`[TTS:${projectId}] Seg ${index} FALLBACK: Using Google Translate (AZ/TR/RU support)`);
    
    // Use the most reliable endpoint with tw-ob client
    const encoded = encodeURIComponent(cleanText);
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=1`;
    
    const response = await fetch(googleUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/"
      }
    });
    
    if (!response.ok) {
        throw new Error(`Google code ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    await saveBufferToFile(Buffer.from(arrayBuffer), outputPath);
    logPipeline(projectId, `Seg ${index} done (Fallback) 🌐`);
  } catch (err: any) {
    // Both failed! Prioritize showing the OpenAI error because it's the "real" reason for low quality/failure
    const finalError = lastOpenAIError ? `OpenAI error: ${lastOpenAIError}` : `TTS failed: ${err.message}`;
    console.error(`[TTS:${projectId}] Seg ${index} FATAL: ${finalError}`);
    logPipeline(projectId, `❌ ${finalError}`);
    throw new Error(finalError);
  }
}

async function saveBufferToFile(buffer: Buffer, outputPath: string): Promise<void> {
  const writeStream = createWriteStream(outputPath);
  writeStream.write(buffer);
  writeStream.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });

  if (!existsSync(outputPath) || statSync(outputPath).size < 100) {
    throw new Error(`TTS: output file missing or too small at ${outputPath}`);
  }
}
