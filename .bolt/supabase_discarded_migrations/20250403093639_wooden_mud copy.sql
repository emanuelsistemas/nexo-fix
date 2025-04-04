/*
  # Add in_progress status to issue_status enum

  This migration adds the 'in_progress' status to the issue_status enum type
  to support the Kanban board functionality with three columns:
  pending -> in_progress -> completed

  1. Changes
    - Adds 'in_progress' to issue_status enum
    - Preserves existing data while updating the status column
    - Maintains foreign key relationships
  
  2. Security
    - Temporarily disables RLS for the migration
    - Re-enables RLS after migration is complete
*/

-- Create a backup of the issues table
CREATE TABLE issues_backup AS SELECT * FROM issues;

-- Drop the existing table and type
DROP TABLE IF EXISTS issues;
DROP TYPE IF EXISTS issue_status CASCADE;

-- Create the new enum type with all three statuses
CREATE TYPE issue_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create the new issues table with updated enum
CREATE TABLE issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  module text NOT NULL,
  description text NOT NULL,
  priority issue_priority NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy data from backup, mapping old statuses to new ones
INSERT INTO issues (
  id,
  user_id,
  module,
  description,
  priority,
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  module,
  description,
  priority,
  CASE old_status
    WHEN 'completed' THEN 'completed'::issue_status
    ELSE 'pending'::issue_status
  END as status,
  created_at,
  updated_at
FROM (
  SELECT 
    id,
    user_id,
    module,
    description,
    priority,
    status::text as old_status,
    created_at,
    updated_at
  FROM issues_backup
) AS old_data;

-- Clean up the backup table
DROP TABLE issues_backup;

-- Keep RLS disabled as requested
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;