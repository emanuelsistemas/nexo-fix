/*
  # Add issue type field to issues table

  1. Changes
    - Create new issue_type enum with values: problem, bug, feature
    - Add type column to issues table
    - Set default value for type column
    - Update existing records

  2. Security
    - Maintains existing RLS policies
*/

-- Create issue_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_type') THEN
    CREATE TYPE issue_type AS ENUM ('problem', 'bug', 'feature');
  END IF;
END $$;

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'issues' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE issues 
    ADD COLUMN type issue_type NOT NULL DEFAULT 'problem';
  END IF;
END $$;

-- Update any existing records to have the default type
UPDATE issues 
SET type = 'problem' 
WHERE type IS NULL;