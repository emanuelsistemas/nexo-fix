-- Drop existing foreign key constraints
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Recreate foreign key constraints
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE issues
ADD CONSTRAINT issues_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- Disable RLS on all tables for testing
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;