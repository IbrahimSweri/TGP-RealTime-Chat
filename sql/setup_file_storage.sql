-- Setup storage bucket for file attachments
-- Execute this after setup_storage.sql

-- 1. Create attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view attachments
CREATE POLICY "Attachments are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'attachments' );

-- 3. Allow authenticated users to upload attachments
CREATE POLICY "Authenticated users can upload attachments."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );

-- 4. Allow users to update their own attachments
CREATE POLICY "Users can update their own attachments."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'attachments' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'attachments' AND auth.uid() = owner );

-- 5. Allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'attachments' AND auth.uid() = owner );

-- 6. Add file_url column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS file_size bigint;

-- 7. Add index for file queries
CREATE INDEX IF NOT EXISTS idx_messages_file_url ON messages(file_url) WHERE file_url IS NOT NULL;

