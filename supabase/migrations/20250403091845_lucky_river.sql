/*
  # Fix user relationship in issues table

  1. Changes
    - Drop existing foreign key constraint if it exists
    - Create new foreign key constraint between issues.user_id and auth.users.id
    - Enable RLS on issues table
    - Update policies to handle user relationships correctly

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user_id validation on insert
*/

-- Drop existing foreign key constraint if it exists
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_user_id_fkey;

-- Add new foreign key constraint
ALTER TABLE issues
ADD CONSTRAINT issues_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Enable RLS on issues table
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to update all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to delete all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to insert issues" ON issues;

-- Create new policies
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

CREATE POLICY "Allow authenticated users to insert issues"
  ON issues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);