/*
  # Add issue type enum and column

  1. Changes
    - Add new enum type for issue categories
    - Add type column to issues table
    - Set default type value
    - Update existing records
*/

-- Create the issue type enum
CREATE TYPE issue_type AS ENUM ('problem', 'bug', 'feature');

-- Add the type column to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS type issue_type NOT NULL DEFAULT 'problem';

-- Update existing records to have a default type
UPDATE issues SET type = 'problem' WHERE type IS NULL;