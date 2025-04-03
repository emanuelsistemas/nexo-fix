/*
  # Add in_progress status to issue_status enum

  This migration adds the 'in_progress' status to the issue_status enum type
  to support the Kanban board functionality with three columns:
  pending -> in_progress -> completed
*/

-- Temporarily disable RLS
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Drop the existing enum type and recreate it with the new value
DROP TYPE IF EXISTS issue_status CASCADE;
CREATE TYPE issue_status AS ENUM ('pending', 'in_progress', 'completed');

-- Recreate the issues table with the new enum type
CREATE TABLE IF NOT EXISTS new_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  module text NOT NULL,
  description text NOT NULL,
  priority issue_priority NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy data from old table to new table, setting in_progress status to pending
INSERT INTO new_issues (id, user_id, module, description, priority, status, created_at, updated_at)
SELECT 
  id, 
  user_id, 
  module, 
  description, 
  priority,
  CASE 
    WHEN status::text = 'completed' THEN 'completed'::issue_status
    ELSE 'pending'::issue_status
  END,
  created_at,
  updated_at
FROM issues;

-- Drop old table and rename new table
DROP TABLE issues;
ALTER TABLE new_issues RENAME TO issues;

-- Keep RLS disabled as requested
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;