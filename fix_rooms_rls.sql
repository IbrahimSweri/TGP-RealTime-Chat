-- Fix RLS policies for rooms table
-- This allows everyone to read rooms but only authenticated users to modify them

-- Enable RLS on rooms table (if not already enabled)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_read_rooms" ON rooms;
DROP POLICY IF EXISTS "allow_insert_rooms" ON rooms;
DROP POLICY IF EXISTS "allow_update_rooms" ON rooms;
DROP POLICY IF EXISTS "allow_delete_rooms" ON rooms;

-- Allow everyone to SELECT (read) rooms
CREATE POLICY "allow_read_rooms" 
ON rooms FOR SELECT 
USING (true);

-- Allow authenticated users to INSERT rooms
CREATE POLICY "allow_insert_rooms" 
ON rooms FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to UPDATE rooms
CREATE POLICY "allow_update_rooms" 
ON rooms FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to DELETE rooms
CREATE POLICY "allow_delete_rooms" 
ON rooms FOR DELETE 
USING (auth.role() = 'authenticated');
