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

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing in environment variables");
  }

  logPipeline(projectId, `OpenAI TTS seg ${index} [${selectedVoice}]: "${text.substring(0, 50)}"`);

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

    if (!response.ok) {
      const errorBody = await response.text();
      logPipeline(projectId, `❌ OpenAI API Error ${response.status}: ${errorBody}`);
      throw new Error(`OpenAI Error ${response.status}: ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const writeStream = createWriteStream(outputPath);
    writeStream.write(buffer);
    writeStream.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err) => reject(err));
    });

    if (!existsSync(outputPath) || statSync(outputPath).size < 100) {
      throw new Error(`OpenAI TTS: output file missing or too small at ${outputPath}`);
    }

    logPipeline(projectId, `Seg ${index} done (${statSync(outputPath).size} bytes) ✅`);
  } catch (err: any) {
    logPipeline(projectId, `❌ OpenAI TTS seg ${index} failed: ${err.message}`);
    throw err;
  }
}
