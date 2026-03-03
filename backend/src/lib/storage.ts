import { supabase } from "./supabase";
import { createReadStream, existsSync } from "fs";
import { basename } from "path";

const BUCKET = "dubverse-videos";

/**
 * Upload a local file to Supabase Storage.
 * Returns the storage path (e.g. "projectId/final_dubbed.mp4")
 */
export async function uploadFile(localPath: string, storagePath: string): Promise<string> {
  if (!existsSync(localPath)) throw new Error(`File not found for upload: ${localPath}`);

  const stream = createReadStream(localPath);
  const contentType = localPath.endsWith(".mp4")
    ? "video/mp4"
    : localPath.endsWith(".mp3")
      ? "audio/mpeg"
      : "application/octet-stream";

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, stream as any, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

/**
 * Get a signed URL for a private storage file (expires in 1 hour by default).
 */
export async function getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) throw new Error(`Could not generate signed URL: ${error?.message}`);
  return data.signedUrl;
}

/**
 * Delete all files for a project from storage (cleanup).
 */
export async function deleteProjectFiles(projectId: string): Promise<void> {
  const { data: files } = await supabase.storage.from(BUCKET).list(projectId);
  if (files?.length) {
    const paths = files.map((f) => `${projectId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
}
