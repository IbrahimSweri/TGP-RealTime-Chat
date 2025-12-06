-- 1) Add 'type' column to rooms to distinguish between public/general and direct conversations
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'direct', 'group'));

-- 2) Create room_participants table to track who is in which private/direct room
CREATE TABLE IF NOT EXISTS room_participants (
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- 3) Enable RLS on the new table
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies for room_participants
-- Users can see their own participations
CREATE POLICY "Users can select their own room participation" 
ON room_participants FOR SELECT 
USING (auth.uid() = user_id);

-- Users can join rooms (or be added - for now allow self-insert for creation flows)
CREATE POLICY "Users can insert their own participation" 
ON room_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5) Update RLS on 'rooms' table to restrict access to private rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- allow all for public rooms (existing behavior)
CREATE POLICY "Public rooms are visible to everyone" 
ON rooms FOR SELECT 
USING (type = 'public');

-- allow access to private rooms ONLY if user is a participant
CREATE POLICY "Participants can view their private rooms" 
ON rooms FOR SELECT 
USING (
  type = 'public' 
  OR 
  id IN (SELECT room_id FROM room_participants WHERE user_id = auth.uid())
);

-- Allow creating new rooms (authenticated users)
CREATE POLICY "Users can create rooms" 
ON rooms FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 6) Update Messages RLS to respect room privacy
-- IMPORTANT: We need to ensure users can only read messages from rooms they have access to.
-- Dropping existing permissive policy if it exists (or updating it)

DROP POLICY IF EXISTS "__allow_all_select" ON messages;

CREATE POLICY "Users can read messages in public rooms or rooms they belong to" 
ON messages FOR SELECT 
USING (
  exists (
    select 1 from rooms 
    where rooms.id = messages.room_id 
    and (
      rooms.type = 'public' 
      or 
      exists (select 1 from room_participants where room_id = messages.room_id and user_id = auth.uid())
    )
  )
);

-- 7) Helper Function to create a direct chat transactionally (Optional but recommended for consistency)
-- This tries to find an existing direct chat between two users, or creates one if none exists.
CREATE OR REPLACE FUNCTION get_or_create_direct_room(other_user_id uuid)
RETURNS uuid AS $$
DECLARE
  existing_room_id uuid;
  new_room_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- 1. Search for an existing 'direct' room where both users are participants
  SELECT r.id INTO existing_room_id
  FROM rooms r
  JOIN room_participants rp1 ON r.id = rp1.room_id
  JOIN room_participants rp2 ON r.id = rp2.room_id
  WHERE r.type = 'direct'
  AND rp1.user_id = current_user_id
  AND rp2.user_id = other_user_id
  LIMIT 1;

  IF existing_room_id IS NOT NULL THEN
    RETURN existing_room_id;
  END IF;

  -- 2. If no room exists, create a new one
  INSERT INTO rooms (name, type)
  VALUES ('Direct Chat ' || gen_random_uuid(), 'direct') -- Ensure unique name
  RETURNING id INTO new_room_id;

  -- 3. Add both participants
  INSERT INTO room_participants (room_id, user_id)
  VALUES 
    (new_room_id, current_user_id),
    (new_room_id, other_user_id);

  RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
