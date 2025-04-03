/*
  # Add systems table and update access policies

  1. New Tables
    - `systems`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Changes
    - Add systems table with default values
    - Update RLS policies for issues table
    - Enable RLS on both tables

  3. Security
    - Enable RLS on systems table
    - Add policies for authenticated users to read systems
    - Update policies for issues table to allow full access
*/

-- Create systems table if it doesn't exist
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on systems table
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop existing policies on systems table
    DROP POLICY IF EXISTS "Allow authenticated users to read systems" ON systems;
    
    -- Drop existing policies on issues table
    DROP POLICY IF EXISTS "Allow authenticated users to read all issues" ON issues;
    DROP POLICY IF EXISTS "Allow authenticated users to update all issues" ON issues;
    DROP POLICY IF EXISTS "Allow authenticated users to delete all issues" ON issues;
END $$;

-- Create new policies
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

-- Add new policies for issues table
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

-- Enable RLS on issues table if not already enabled
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;