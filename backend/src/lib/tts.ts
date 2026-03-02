import { spawnSync } from "child_process";
import { join } from "path";
import { existsSync, statSync } from "fs";
import { logPipeline } from "./ffmpeg";

const VOICE_MAP: Record<string, string> = {
  az: "az-AZ-BabekNeural",
  tr: "tr-TR-AhmetNeural",
  en: "en-US-ChristopherNeural",
  ru: "ru-RU-DmitryNeural",
  de: "de-DE-ConradNeural",
  fr: "fr-FR-HenriNeural",
  es: "es-ES-AlvaroNeural",
  ar: "ar-SA-HamedNeural",
  zh: "zh-CN-YunxiNeural",
  ja: "ja-JP-InterKeitaNeural",
  ko: "ko-KR-InJunNeural",
  pt: "pt-BR-AntonioNeural",
  it: "it-IT-DiegoNeural",
  hi: "hi-IN-MadhurNeural",
};

export function getVoiceForLanguage(lang: string): string {
  return VOICE_MAP[lang] || "az-AZ-BabekNeural";
}

export async function generateTTSSegment(
  text: string,
  outputPath: string,
  lang: string,
  projectId: string,
  index: number
): Promise<void> {
  const voice = getVoiceForLanguage(lang);
  const bridgePath = join(process.cwd(), "..", "scripts", "tts_bridge.py");

  const result = spawnSync("python", [bridgePath, text, outputPath, voice]);

  if (result.status !== 0) {
    const err = result.stderr?.toString() || "Unknown Python error";
    throw new Error(`Edge-TTS Failed: ${err}`);
  }

  if (!existsSync(outputPath)) {
    throw new Error(`Edge-TTS failed to create file at ${outputPath}`);
  }

  const stats = statSync(outputPath);
  logPipeline(projectId, `Segment ${index} saved (${stats.size} bytes).`);
}
