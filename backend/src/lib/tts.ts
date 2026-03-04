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
          model: "tts-1",
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
        const errText = await response.text();
        console.error(`[TTS:${projectId}] Seg ${index} OpenAI FAILED (${response.status}): ${errText}`);
        logPipeline(projectId, `⚠️ OpenAI failed (${response.status}), falling back to Google...`);
      }
    } catch (err: any) {
      console.error(`[TTS:${projectId}] Seg ${index} OpenAI Error:`, err.message);
      logPipeline(projectId, `⚠️ OpenAI error, falling back to Google...`);
    }
  }

  // Attempt 2: Google Translate TTS (100% Free Fallback)
  try {
    console.log(`[TTS:${projectId}] Seg ${index} FALLBACK: Using Google Translate TTS (voice: ${selectedVoice})`);
    const encoded = encodeURIComponent(text.substring(0, 200)); 
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
    
    const response = await fetch(googleUrl);
    if (!response.ok) throw new Error(`Google TTS failed: ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    await saveBufferToFile(Buffer.from(arrayBuffer), outputPath);
    logPipeline(projectId, `Seg ${index} done (Google Fallback) 🌐`);
  } catch (err: any) {
    console.error(`[TTS:${projectId}] Seg ${index} FATAL: All TTS failed`, err.message);
    logPipeline(projectId, `❌ All TTS attempts failed for seg ${index}: ${err.message}`);
    throw err;
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
