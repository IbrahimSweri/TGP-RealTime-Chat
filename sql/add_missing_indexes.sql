-- Add missing database indexes for better query performance
-- Execute this after all other migrations

-- 1. Index on profiles.username for faster user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 2. Index on messages.user_id for faster user message queries
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- 3. Composite index on room_participants for faster joins
-- This index helps with queries that check if a user is in a room
CREATE INDEX IF NOT EXISTS idx_room_participants_user_room ON room_participants(user_id, room_id);

-- 4. Index on messages.created_at for faster time-based queries
-- (This might already exist, but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 5. Index on rooms.type for faster filtering by room type
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);

-- 6. Index on profiles.updated_at for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);

