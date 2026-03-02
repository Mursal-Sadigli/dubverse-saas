export type ProjectStatus = "uploading" | "transcribing" | "translating" | "dubbing" | "completed" | "failed";

export type TargetLanguage = {
  code: string;
  label: string;
  flag: string;
};

export type Subtitle = {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
  translatedText?: string;
};

export type Project = {
  id: string;
  name: string;
  userId: string;
  status: ProjectStatus;
  sourceLanguage: string;
  targetLanguage: string;
  videoPath?: string;
  audioPath?: string;
  dubbedAudioPath?: string;
  finalVideoPath?: string;
  subtitles: Subtitle[];
  createdAt: string;
  updatedAt: string;
  error?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
};

export const SUPPORTED_LANGUAGES: TargetLanguage[] = [
  { code: "az", label: "Azerbaijani", flag: "🇦🇿" },
  { code: "tr", label: "Turkish", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
];
