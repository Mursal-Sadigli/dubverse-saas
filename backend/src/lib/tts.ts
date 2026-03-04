import { ElevenLabsClient } from "elevenlabs";
import { createWriteStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { pipeline as streamPipeline } from "stream/promises";
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
    const client = new ElevenLabsClient({ apiKey });
    const audioData = await client.textToSpeech.convert(selectedVoice, {
      text,
      model_id: "eleven_multilingual_v2", // More widely supported than turbo
      output_format: "mp3_44100_128",
      voice_settings: {
        stability: 0.50,         // balanced for natural tone
        similarity_boost: 0.80,  // high similarity to original voice
        style: 0.0,              // disable unnatural style exaggeration
        use_speaker_boost: true,
      },
    });

    // Convert response to readable stream and pipe to file
    const readable = audioData instanceof Readable
      ? audioData
      : Readable.from(audioData as AsyncIterable<Buffer>);

    await streamPipeline(readable, createWriteStream(outputPath));

    if (!existsSync(outputPath) || statSync(outputPath).size < 100) {
      throw new Error(`ElevenLabs: output file missing or too small at ${outputPath}`);
    }

    logPipeline(projectId, `Seg ${index} done (${statSync(outputPath).size} bytes) ✅`);
  } catch (err: any) {
    const maskedKey = apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length - 4);
    logPipeline(projectId, `❌ ElevenLabs seg ${index} failed (Key: ${maskedKey}): ${err.message}`);
    throw err;
  }
}
