import { ElevenLabsClient } from "elevenlabs";
import { createWriteStream, existsSync } from "fs";
import { pipeline as streamPipeline } from "stream/promises";
import { Readable } from "stream";
import { logPipeline } from "./ffmpeg";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

// ElevenLabs multilingual_v2 supports all our target languages.
// Using a single consistent voice (Adam) for all languages for simplicity.
// Can be extended to per-language voice mapping.
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam — natural, clear, works in all languages

export async function generateTTSSegment(
  text: string,
  outputPath: string,
  lang: string,
  projectId: string,
  index: number
): Promise<void> {
  logPipeline(projectId, `ElevenLabs TTS segment ${index}: "${text.substring(0, 40)}..."`);

  try {
    const audioStream = await client.generate({
      voice: DEFAULT_VOICE_ID,
      model_id: "eleven_multilingual_v2",
      text,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.80,
        style: 0.15,
        use_speaker_boost: true,
      },
    });

    // Write stream to file
    const writeStream = createWriteStream(outputPath);
    if (audioStream instanceof Readable) {
      await streamPipeline(audioStream, writeStream);
    } else {
      // Handle async iterable returned by some SDK versions
      await streamPipeline(
        Readable.from(audioStream as AsyncIterable<Buffer>),
        writeStream
      );
    }

    if (!existsSync(outputPath)) {
      throw new Error(`ElevenLabs: file not created at ${outputPath}`);
    }
    logPipeline(projectId, `Segment ${index} written via ElevenLabs ✅`);
  } catch (err: any) {
    logPipeline(projectId, `ElevenLabs TTS failed (seg ${index}): ${err.message}`);
    throw new Error(`ElevenLabs TTS Error: ${err.message}`);
  }
}
