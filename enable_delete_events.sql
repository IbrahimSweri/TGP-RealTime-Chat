-- Enable realtime for DELETE events on messages table
-- This allows Supabase to broadcast DELETE events to subscribed clients

alter publication supabase_realtime add table messages;

-- If the above doesn't work, you may need to recreate the publication:
-- drop publication if exists supabase_realtime;
-- create publication supabase_realtime for table messages;

-- Make sure the messages table has REPLICA IDENTITY set to FULL
-- This is required for DELETE events to include the old row data
alter table messages replica identity full;
