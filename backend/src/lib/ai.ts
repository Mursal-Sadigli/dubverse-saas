import OpenAI from "openai";
import Groq from "groq-sdk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROK_API_KEY });

const LANG_NAMES: Record<string, string> = {
  az: "Azerbaijani", tr: "Turkish", en: "English", ru: "Russian",
  de: "German", fr: "French", es: "Spanish", ar: "Arabic",
  zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese",
  it: "Italian", hi: "Hindi",
};

export async function transcribeAudio(audioBuffer: Buffer): Promise<any[]> {
  const uint8Array = new Uint8Array(audioBuffer);
  const audioFile = new File([uint8Array], "audio.mp3", { type: "audio/mpeg" });
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3",
    response_format: "verbose_json",
  });
  return (transcription as any).segments || [];
}

export async function translateText(
  subtitles: any[],
  sourceLang: string,
  targetLang: string
): Promise<Record<number, string>> {
  const targetName = LANG_NAMES[targetLang] || targetLang;
  const sourceName = LANG_NAMES[sourceLang] || sourceLang;
  const subtitleTexts = subtitles.map((s, i) => `[${i + 1}] ${s.text}`).join("\n");

  const SYSTEM_PROMPT = `You are a professional video dubbing translator specializing in lip-sync accuracy.
Translate numbered subtitle segments from ${sourceName} to ${targetName}.

Rules:
- Keep translated sentences roughly the SAME LENGTH as the original (for lip-sync timing).
- Maintain the natural spoken rhythm and pacing.
- Preserve tone, emotion, and style of the speaker.
- Output ONLY translated lines in format: [n] translated text
- No explanations, no extra text.`;

  // Primary: Groq Llama (fast, free)
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: subtitleTexts },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content || "";
  const mapping: Record<number, string> = {};
  for (const line of content.split("\n").filter(l => l.trim())) {
    const match = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (match) mapping[parseInt(match[1])] = match[2].trim();
  }
  return mapping;
}
