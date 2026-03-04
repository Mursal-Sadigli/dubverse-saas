import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

/* ── Project helpers ── */

export async function getProject(id: string) {
  console.log(`[DB] Fetching project: ${id}`);
  const { data, error } = await supabase
    .from("projects")
    .select("*, subtitles(*)")
    .eq("id", id)
    .single();
  if (error) {
    console.error(`[DB] Error fetching project ${id}:`, error);
    throw error;
  }
  console.log(`[DB] Successfully fetched project: ${id}`);
  return data;
}

export async function getProjectsByUser(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, subtitles(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProject(input: {
  userId: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  videoPath?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  voiceId?: string;
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: input.userId,
      name: input.name,
      source_language: input.sourceLanguage,
      target_language: input.targetLanguage,
      video_path: input.videoPath,
      youtube_url: input.youtubeUrl,
      thumbnail_url: input.thumbnailUrl,
      voice_id: input.voiceId ?? null,
      status: "uploading",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, fields: Record<string, any>) {
  // Map camelCase to snake_case for Supabase columns
  const mapped: Record<string, any> = {};
  const camelToSnake: Record<string, string> = {
    videoPath: "video_path",
    audioPath: "audio_path",
    dubbedAudioPath: "dubbed_audio_path",
    finalVideoPath: "final_video_path",
    youtubeUrl: "youtube_url",
    thumbnailUrl: "thumbnail_url",
    sourceLanguage: "source_language",
    targetLanguage: "target_language",
    voiceId: "voice_id",
    voiceSettings: "voice_settings",
  };
  for (const [k, v] of Object.entries(fields)) {
    if (k === "subtitles") continue; // handled separately
    mapped[camelToSnake[k] ?? k] = v;
  }
  const { error } = await supabase.from("projects").update(mapped).eq("id", id);
  if (error) throw error;

  // Handle subtitles separately (bulk upsert)
  if (fields.subtitles) {
    await upsertSubtitles(id, fields.subtitles);
  }
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertSubtitles(
  projectId: string,
  subtitles: Array<{ id: string; start: number; end: number; text: string; translatedText?: string; speaker_id?: number; speaker_gender?: string }>
) {
  if (!subtitles.length) return;

  // Delete old and insert fresh (simple & reliable)
  await supabase.from("subtitles").delete().eq("project_id", projectId);

  const rows = subtitles.map((s, i) => ({
    id: s.id,
    project_id: projectId,
    position: i,
    start_time: s.start,
    end_time: s.end,
    text: s.text,
    translated_text: s.translatedText ?? null,
    speaker_id: s.speaker_id || 1,
    speaker_gender: s.speaker_gender ?? null,
  }));

  const { error } = await supabase.from("subtitles").insert(rows);
  if (error) throw error;
}

/* ── Map DB row → frontend-friendly shape ── */
export function mapProject(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    status: row.status,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    videoPath: row.video_path,
    audioPath: row.audio_path,
    dubbedAudioPath: row.dubbed_audio_path,
    finalVideoPath: row.final_video_path,
    youtubeUrl: row.youtube_url,
    thumbnailUrl: row.thumbnail_url,
    error: row.error,
    voiceId: row.voice_id,
    voiceSettings: row.voice_settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subtitles: (row.subtitles ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((s: any) => ({
        id: s.id,
        start: s.start_time,
        end: s.end_time,
        text: s.text,
        translatedText: s.translated_text,
        speaker_id: s.speaker_id,
        speaker_gender: s.speaker_gender,
      })),
  };
}
