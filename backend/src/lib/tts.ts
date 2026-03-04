import { createWriteStream, existsSync, statSync } from "fs";
import { logPipeline } from "./ffmpeg";

// Default fallback voice (Rachel)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function generateTTSSegment(
  text: string,
  outputPath: string,
  lang: string,
  projectId: string,
  index: number,
  voiceId?: string
): Promise<void> {
  const selectedVoice = voiceId || DEFAULT_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing in environment variables");
  }

  logPipeline(projectId, `ElevenLabs TTS seg ${index} [${selectedVoice}]: "${text.substring(0, 50)}"`);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const maskedKey = apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length - 4);
      logPipeline(projectId, `❌ ElevenLabs API Error ${response.status} (Key: ${maskedKey}): ${errorBody}`);
      throw new Error(`ElevenLabs Error ${response.status}: ${errorBody}`);
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
      throw new Error(`ElevenLabs: output file missing or too small at ${outputPath}`);
    }

    logPipeline(projectId, `Seg ${index} done (${statSync(outputPath).size} bytes) ✅`);
  } catch (err: any) {
    logPipeline(projectId, `❌ ElevenLabs seg ${index} failed: ${err.message}`);
    throw err;
  }
}
