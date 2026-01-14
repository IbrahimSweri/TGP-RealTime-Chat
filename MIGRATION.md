# Database Migration Guide

This guide explains the correct order to execute SQL migration files in your Supabase project.

## Migration Order

Execute the SQL files in your Supabase SQL Editor in the following order:

### 1. Base Schema (`sql/supabase_schema.sql`)

**Purpose**: Creates the foundational database structure.

**What it does**:
- Creates `profiles` table
- Creates `rooms` table
- Creates `messages` table
- Sets up indexes
- Creates default "General" room
- Sets up realtime triggers
- Creates moderation trigger
- Sets up initial permissive RLS policies (development only)

**Execution**: Run this first.

---

### 2. Direct Chat Features (`sql/add_direct_chat_features.sql`)

**Purpose**: Adds support for direct messaging between users.

**What it does**:
- Adds `type` column to `rooms` table ('public', 'direct', 'group')
- Creates `room_participants` table
- Sets up RLS policies for private rooms
- Creates `get_or_create_direct_room()` function
- **Replaces** permissive message RLS with proper room-based access

**Execution**: Run after `sql/supabase_schema.sql`

**Note**: This file replaces the `__allow_all_select` policy on messages with a proper room-based policy.

---

### 3. Link Messages to Profiles (`sql/link_messages_to_profiles.sql`)

**Purpose**: Establishes proper foreign key relationship between messages and profiles.

**What it does**:
- Cleans up orphaned user_ids
- Backfills missing profiles for valid users
- Adds foreign key constraint `fk_messages_profiles`

**Execution**: Run after `sql/add_direct_chat_features.sql`

---

### 4. Avatar Support (`sql/add_avatar_to_messages.sql`)

**Purpose**: Adds avatar URL column to messages table.

**What it does**:
- Adds `avatar_url` column to `messages` table
- Updates realtime publication

**Execution**: Run after `sql/link_messages_to_profiles.sql`

---

### 5. Storage Setup (`sql/setup_storage.sql`)

**Purpose**: Configures Supabase Storage for avatar uploads.

**What it does**:
- Creates `avatars` storage bucket
- Sets up public read access
- Sets up authenticated upload/update policies

**Execution**: Run after `sql/add_avatar_to_messages.sql`

---

### 6. Fix Profiles RLS (`sql/fix_profiles_rls.sql`)

**Purpose**: Ensures profiles are publicly readable.

**What it does**:
- Enables RLS on `profiles` table
- Creates policy for public profile viewing

**Execution**: Run after `sql/setup_storage.sql`

---

### 7. Fix Rooms RLS (`sql/fix_rooms_rls.sql`)

**Purpose**: Sets up proper RLS policies for rooms table.

**What it does**:
- Enables RLS on `rooms` table
- Allows public read access
- Restricts write access to authenticated users

**Execution**: Run after `sql/fix_profiles_rls.sql`

**Note**: This may conflict with policies from `sql/add_direct_chat_features.sql`. If you see policy conflicts, you can skip this file as `sql/add_direct_chat_features.sql` already sets up room RLS.

---

### 8. Enable Delete Events (`sql/enable_delete_events.sql`)

**Purpose**: Enables realtime DELETE event broadcasting.

**What it does**:
- Adds `messages` table to realtime publication
- Sets `REPLICA IDENTITY FULL` for DELETE events

**Execution**: Run last.

---

## Quick Setup Script

If you want to execute all migrations at once, you can combine them in this order:

```sql
-- 1. Base Schema
[Contents of sql/supabase_schema.sql]

-- 2. Direct Chat Features
[Contents of sql/add_direct_chat_features.sql]

-- 3. Link Messages to Profiles
[Contents of sql/link_messages_to_profiles.sql]

-- 4. Avatar Support
[Contents of sql/add_avatar_to_messages.sql]

-- 5. Storage Setup
[Contents of sql/setup_storage.sql]

-- 6. Fix Profiles RLS
[Contents of sql/fix_profiles_rls.sql]

-- 7. Fix Rooms RLS (optional - may conflict with step 2)
[Contents of sql/fix_rooms_rls.sql]

-- 8. Enable Delete Events
[Contents of sql/enable_delete_events.sql]
```

## Verification

After running all migrations, verify:

1. **Tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'rooms', 'messages', 'room_participants');
   ```

2. **RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('profiles', 'rooms', 'messages', 'room_participants');
   ```

3. **Function exists**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'get_or_create_direct_room';
   ```

4. **Storage bucket exists**:
   - Go to Storage in Supabase dashboard
   - Verify `avatars` bucket exists and is public

5. **Realtime is enabled**:
   - Go to Database > Replication in Supabase dashboard
   - Verify `messages` table is listed

## Troubleshooting

### Policy Conflicts

If you see "policy already exists" errors:
- Policies from `sql/add_direct_chat_features.sql` may conflict with `sql/fix_rooms_rls.sql`
- You can safely skip `sql/fix_rooms_rls.sql` if you've already run `sql/add_direct_chat_features.sql`

### Foreign Key Errors

If you see foreign key constraint errors:
- Ensure `sql/link_messages_to_profiles.sql` runs after `sql/add_direct_chat_features.sql`
- Check that all user_ids in messages reference valid profiles

### Realtime Not Working

If realtime updates aren't working:
- Verify `sql/enable_delete_events.sql` was executed
- Check Supabase Realtime is enabled in project settings
- Verify `messages` table is in `supabase_realtime` publication

## Rolling Back

To roll back migrations, you would need to:

1. Drop tables in reverse order
2. Remove RLS policies
3. Drop functions
4. Remove storage buckets

**Note**: This will delete all data. Always backup before rolling back.

## Next Steps

After migrations are complete:
1. Test authentication flow
2. Test message sending/receiving
3. Test direct messaging
4. Test avatar uploads
5. Verify real-time updates work

