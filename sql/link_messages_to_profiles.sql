-- 1. Nullify user_id for messages where the user no longer exists in auth.users
-- This keeps the message content but removes the invalid user reference
UPDATE messages
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users);

-- 2. Backfill missing profiles for VALID users only
INSERT INTO profiles (id, username, updated_at)
SELECT DISTINCT 
  m.user_id, 
  m.username || '-' || substring(m.user_id::text, 1, 8), 
  NOW()
FROM messages m
WHERE m.user_id IS NOT NULL 
  AND m.user_id NOT IN (SELECT id FROM profiles)
  AND m.user_id IN (SELECT id FROM auth.users)
ON CONFLICT (id) DO NOTHING;

-- 3. Add Foreign Key constraint
ALTER TABLE messages
ADD CONSTRAINT fk_messages_profiles
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE SET NULL;
