-- Check existing policies
select * from pg_policies where tablename = 'profiles';

-- Enable RLS on profiles if not already enabled
alter table profiles enable row level security;

-- Create a policy to allow all authenticated users to view all profiles
-- This is necessary for the user list to work
-- First drop the policy if it exists to avoid errors
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles are viewable by authenticated users" on profiles;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );
