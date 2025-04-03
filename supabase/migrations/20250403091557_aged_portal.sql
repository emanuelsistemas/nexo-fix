/*
  # Add INSERT policy for issues table

  1. Changes
    - Adds INSERT policy for authenticated users
    - Ensures users can only create issues with their own user_id

  2. Security
    - Maintains RLS security by validating user_id matches auth.uid()
*/

-- Remove existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert issues" ON issues;

-- Create new INSERT policy
CREATE POLICY "Allow authenticated users to insert issues"
  ON issues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);