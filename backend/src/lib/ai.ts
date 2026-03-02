import Groq from "groq-sdk";

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
  const targetLangName = LANG_NAMES[targetLang] || targetLang;
  const sourceLangName = LANG_NAMES[sourceLang] || sourceLang;
  const subtitleTexts = subtitles.map((s, i) => `[${i + 1}] ${s.text}`).join("\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a professional video dubbing translator. Translate numbered subtitle segments from ${sourceLangName} to ${targetLangName}. Output ONLY translated lines in format: [n] translated text. No explanations.`,
      },
      { role: "user", content: subtitleTexts },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || "";
  const lines = content.split("\n").filter((l) => l.trim());
  const mapping: Record<number, string> = {};
  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (match) mapping[parseInt(match[1])] = match[2].trim();
  }
  return mapping;
}
