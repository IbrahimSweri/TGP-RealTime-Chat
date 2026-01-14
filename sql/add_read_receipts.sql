-- Create message_reads table for read receipts
-- Execute this after all other migrations

-- 1. Create message_reads table
CREATE TABLE IF NOT EXISTS message_reads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id) -- One read receipt per user per message
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_read_at ON message_reads(read_at DESC);

-- 3. Enable RLS
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view read receipts for messages in rooms they have access to
CREATE POLICY "Users can view read receipts for accessible messages"
ON message_reads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN rooms r ON m.room_id = r.id
    WHERE m.id = message_reads.message_id
    AND (
      r.type = 'public'
      OR EXISTS (
        SELECT 1 FROM room_participants rp
        WHERE rp.room_id = r.id
        AND rp.user_id = auth.uid()
      )
    )
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
ON message_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Add to realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel
      WHERE prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND prrelid = 'public.message_reads'::regclass
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
    END IF;
  END IF;
END;
$$;

-- 6. Function to mark all messages in a room as read
CREATE OR REPLACE FUNCTION mark_room_messages_as_read(room_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO message_reads (message_id, user_id, read_at)
  SELECT m.id, auth.uid(), NOW()
  FROM messages m
  WHERE m.room_id = room_uuid
    AND m.user_id != auth.uid() -- Don't mark own messages as read
    AND NOT EXISTS (
      SELECT 1 FROM message_reads mr
      WHERE mr.message_id = m.id
      AND mr.user_id = auth.uid()
    )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

