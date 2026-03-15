-- ============================================================
-- Dubverse AI — Complete Supabase Setup (Tables & Storage)
-- Run this in your new Supabase Project → SQL Editor
-- ============================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT NOT NULL,
  name               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'uploading',
  source_language    TEXT,
  target_language    TEXT,
  video_path         TEXT,
  audio_path         TEXT,
  dubbed_audio_path  TEXT,
  final_video_path   TEXT,
  youtube_url        TEXT,
  thumbnail_url      TEXT,
  error              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subtitles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,
  start_time      FLOAT NOT NULL DEFAULT 0,
  end_time        FLOAT NOT NULL DEFAULT 0,
  text            TEXT,
  translated_text TEXT
);

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_subtitles_project_id ON subtitles(project_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_position ON subtitles(project_id, position);

-- 2. Setup Storage (Create Bucket & Policies)
-- Insert dubverse-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dubverse-videos', 'dubverse-videos', true, 52428800, '{video/mp4,audio/mpeg,application/octet-stream}')
ON CONFLICT (id) DO NOTHING;

-- Policies for "dubverse-videos" (Allow all operations for now to prevent issues from backend)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dubverse-videos');

CREATE POLICY "Allow All Uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'dubverse-videos');

CREATE POLICY "Allow All Updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'dubverse-videos');

CREATE POLICY "Allow All Deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'dubverse-videos');
