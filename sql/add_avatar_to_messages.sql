-- Add avatar_url column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update the realtime publication to include the new column
-- (Supabase usually handles this automatically, but good to be safe)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
