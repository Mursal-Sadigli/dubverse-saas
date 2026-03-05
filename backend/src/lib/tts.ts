import { createWriteStream, existsSync, statSync } from "fs";
import { Communicate } from "edge-tts-universal";
import { logPipeline } from "./ffmpeg";

export async function generateTTSSegment(
  text: string,
  outputPath: string,
  lang: string,
  projectId: string,
  index: number,
  voiceId?: string
): Promise<void> {
  console.log(`[TTS:${projectId}] Seg ${index}: Requesting Edge voice "${voiceId}" (lang: ${lang})`);
  logPipeline(projectId, `TTS seg ${index} [Edge:${voiceId}]: "${text.substring(0, 50)}"`);

  // Attempt 1: Free Edge TTS (Neural Quality)
  try {
    const selectedVoiceId = voiceId || (lang === "az" ? "az-AZ-BanuNeural" : lang === "tr" ? "tr-TR-EmelNeural" : "en-US-AvaNeural");
    
    const communicate = new Communicate(text, { 
      voice: selectedVoiceId,
      // Edge TTS can be sensitive to speed, we keep it default
    });

    const writeStream = createWriteStream(outputPath);
    
    let audioReceived = false;
    for await (const chunk of communicate.stream()) {
      if (chunk.type === "audio" && chunk.data) {
        writeStream.write(chunk.data);
        audioReceived = true;
      }
    }
    
    writeStream.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => {
        if (audioReceived && existsSync(outputPath) && statSync(outputPath).size > 100) {
          console.log(`[TTS:${projectId}] Seg ${index} SUCCESS (Edge TTS)`);
          resolve();
        } else {
          reject(new Error("No audio data received from Edge TTS"));
        }
      });
      writeStream.on("error", (err) => reject(err));
    });
    
    return;
  } catch (err: any) {
    console.warn(`[TTS:${projectId}] Seg ${index} Edge TTS FAILED:`, err.message);
    logPipeline(projectId, `⚠️ Edge TTS failed, trying Translate fallback...`);
  }

  // Attempt 2: Google Translate TTS (Fallback)
  try {
    const cleanText = text.substring(0, 200).replace(/["']/g, ""); 
    const encoded = encodeURIComponent(cleanText);
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=1`;
    
    const response = await fetch(googleUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/"
      }
    });
    
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    
    const { writeFileSync } = await import("fs");
    writeFileSync(outputPath, Buffer.from(arrayBuffer));
    
    logPipeline(projectId, `Seg ${index} done (Translate Fallback) 🌐`);
  } catch (err: any) {
    const finalError = `TTS failed: ${err.message}`;
    console.error(`[TTS:${projectId}] Seg ${index} FATAL: ${finalError}`);
    throw new Error(finalError);
  }
}
