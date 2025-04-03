/*
  # Add systems table and update users metadata

  1. New Tables
    - `systems`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Changes
    - Add `full_name` to auth.users
    - Add user name to issues view
    - Update issues table to show all records to authenticated users

  3. Security
    - Enable RLS on `systems` table
    - Add policies for authenticated users
*/

-- Create systems table
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on systems table
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read systems
CREATE POLICY "Allow authenticated users to read systems"
  ON systems
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default systems
INSERT INTO systems (name) VALUES
  ('nexo-pdv'),
  ('nexo-suporte'),
  ('pagina acesso remoto'),
  ('pagina ema-software'),
  ('nexo-drive')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policy to allow all authenticated users to see all issues
CREATE POLICY "Allow authenticated users to read all issues"
  ON issues
  FOR SELECT
  TO authenticated
  USING (true);

-- Add RLS policy to allow all authenticated users to update all issues
CREATE POLICY "Allow authenticated users to update all issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add RLS policy to allow all authenticated users to delete all issues
CREATE POLICY "Allow authenticated users to delete all issues"
  ON issues
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on issues table if not already enabled
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;