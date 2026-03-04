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
Analyze the provided numbered transcript. Your goal is to detect different speakers and their likely gender (male/female).

Strict Analysis Rules:
1. Identify Speaker Changes: Look for conversational turns, questions/answers, and logical flow.
2. Gender Detection:
   - Names/Titles: "Bəy", "Müəllim", "Mr.", "John" -> male. "Xanım", "Müəllimə", "Mrs.", "Mary" -> female.
   - Context: In many languages, verb endings or adjectives indicate gender.
   - Social Roles: Infer based on how they address each other.
3. Multiple Speakers: Do not assume everyone is Speaker 1. If you see a back-and-forth, assign Speaker 1 and Speaker 2.

Output ONLY the mapping in format: [n] SpeakerID Gender
Example:
[1] 1 male
[2] 2 female
[3] 1 male
No extra text.`;

  try {
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
    // Final pass: ensure every sub has a speaker_id
    return mapped.map(m => ({ ...m, speaker_id: m.speaker_id || 1 }));
  } catch (err) {
    console.error("[diarization] AI error:", err);
    return subtitles.map(m => ({ ...m, speaker_id: 1 }));
  }
}
