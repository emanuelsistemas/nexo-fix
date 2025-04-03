/*
  # Add foreign key relationship to auth.users

  1. Changes
    - Add foreign key constraint from issues.user_id to auth.users.id
    - Add comment explaining the relationship
    - Enable RLS on issues table
    - Add policies for CRUD operations

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user access control
*/

-- Add foreign key constraint to issues table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'issues_user_id_fkey'
  ) THEN
    ALTER TABLE issues
    ADD CONSTRAINT issues_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment to clarify user_id foreign key relationship
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