/*
  # Fix issues table relationship with auth.users

  1. Changes
    - Add foreign key constraint to issues.user_id
    - Update RLS policies
*/

-- Add foreign key constraint to issues table
ALTER TABLE issues
ADD CONSTRAINT issues_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

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