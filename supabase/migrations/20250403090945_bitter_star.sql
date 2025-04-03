/*
  # Fix foreign key relationship between issues and auth.users

  1. Changes
    - Drop existing foreign key constraint if it exists
    - Create new foreign key constraint between issues.user_id and auth.users.id
    - Add comment to clarify the relationship
    - Update RLS policies to ensure proper access control

  2. Security
    - Maintain existing RLS policies for authenticated users
    - Ensure proper cascade behavior on user deletion
*/

-- Drop existing foreign key constraint if it exists
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_user_id_fkey;

-- Add new foreign key constraint
ALTER TABLE issues
ADD CONSTRAINT issues_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add comment to clarify the relationship
COMMENT ON COLUMN issues.user_id IS 'References the auth.users table id';

-- Enable RLS on issues table
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to read all issues" ON issues;
    DROP POLICY IF EXISTS "Allow authenticated users to update all issues" ON issues;
    DROP POLICY IF EXISTS "Allow authenticated users to delete all issues" ON issues;
END $$;

-- Create new policies with proper user_id handling
CREATE POLICY "Allow authenticated users to read all issues"
  ON issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update all issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete all issues"
  ON issues
  FOR DELETE
  TO authenticated
  USING (true);