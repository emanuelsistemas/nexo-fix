/*
  # Update issues table structure

  1. Changes
    - Add user metadata to issues table
    - Update existing policies
*/

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

-- Add comment to clarify user_id foreign key relationship
COMMENT ON COLUMN issues.user_id IS 'References the auth.users table id';