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
- Keep translated sentences VERY BRIEF. If the target language is naturally wordier, prioritize shorter synonyms.
- Match the original timing as closely as possible.
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
export async function diarizeSpeakers(subtitles: any[]): Promise<any[]> {
  const transcript = subtitles.map((s, i) => `[${i + 1}] ${s.text}`).join("\n");

  const SYSTEM_PROMPT = `You are an expert at dialogue analysis and speaker diarization.
Analyze the provided numbered transcript and identify different speakers. 
Assign a numerical Speaker ID (1, 2, 3...) and estimate their gender (male/female).

Strict Analysis Rules:
1. Look for Names & Titles: "Bəy", "Müəllim", "Mr." are male. "Xanım", "Müəllimə", "Mrs.", "Ms." are female.
2. Analyze Social Context: Professional titles, address forms, and conversational role can provide clues.
3. Language Clues: In gendered languages (RU, ES, FR), use verb endings or adjectives.
4. Default Logic: If there is NO clue at all, guess 'male' for authoritative/narrative roles and 'female' for supportive/narrative roles, but prioritize 'unknown' logic if possible (defaulting to 'male' is statistically safer for generic narrators).
5. Output ONLY the mapping in format: [n] SpeakerID Gender
Example: [1] 1 male
No extra text.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content || "";
  const mapped = [...subtitles];
  
  for (const line of content.split("\n").filter(l => l.trim())) {
    const match = line.match(/^\[(\d+)\]\s*(\d+)\s*(male|female)?/i);
    if (match) {
      const index = parseInt(match[1]) - 1;
      if (mapped[index]) {
        mapped[index].speaker_id = parseInt(match[2]);
        if (match[3]) mapped[index].speaker_gender = match[3].toLowerCase();
      }
    }
  }

  // Fallback: Default to Speaker 1 if not identified
  return mapped.map(m => ({ ...m, speaker_id: m.speaker_id || 1 }));
}
