-- Ensure uuid generator is available (pgcrypto provides gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create a table for public profiles (optional for now)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  updated_at timestamptz,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2) Create a table for chat rooms
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3) Create a table for messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid, -- Nullable for guest users; populate once Auth is added
  username text NOT NULL, -- Store display name directly for guests
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  edited_at timestamptz,
  deleted boolean NOT NULL DEFAULT false
);

-- 4) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at ON messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages (room_id);

-- 5) Insert default room if not exists
INSERT INTO rooms (name)
SELECT 'General'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = 'General');

-- 6) Trigger function to broadcast changes to realtime
CREATE OR REPLACE FUNCTION room_messages_broadcast_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to topic: room:{room_id}:messages
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.room_id, OLD.room_id)::text || ':messages',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Attach trigger to messages
DROP TRIGGER IF EXISTS room_messages_broadcast_trigger ON messages;
CREATE TRIGGER room_messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION room_messages_broadcast_trigger();

-- 8) Optional simple moderation trigger (flags banned words)
CREATE OR REPLACE FUNCTION messages_moderation_trigger()
RETURNS TRIGGER AS $$
DECLARE
  banned_words text[] := ARRAY['spam','badword'];
  w text;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    FOREACH w IN ARRAY banned_words LOOP
      IF (NEW.content ILIKE '%' || w || '%') THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{moderation,flagged}', 'true'::jsonb, true);
        NEW.metadata = jsonb_set(NEW.metadata, '{moderation,reason}', to_jsonb('contains banned word: ' || w), true);
        EXIT;
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS messages_moderation_trigger ON messages;
CREATE TRIGGER messages_moderation_trigger
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION messages_moderation_trigger();

-- 9) Enable RLS (permissive for now so development can continue)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "__allow_all_select" ON messages FOR SELECT USING (true);
CREATE POLICY "__allow_all_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "__allow_all_update" ON messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "__allow_all_delete" ON messages FOR DELETE USING (true);

-- 10) Safely add messages to the supabase_realtime publication only if not already present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel
      WHERE prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND prrelid = 'public.messages'::regclass
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
  END IF;
END;
$$;