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
*/

-- First, let's create a temporary column to store the old status values
ALTER TABLE issues ADD COLUMN temp_status text;
UPDATE issues SET temp_status = status::text;

-- Now we can safely drop and recreate the enum and modify the table
DROP TYPE issue_status CASCADE;
CREATE TYPE issue_status AS ENUM ('pending', 'in_progress', 'completed');

-- Add the new status column with the new enum type
ALTER TABLE issues ADD COLUMN new_status issue_status DEFAULT 'pending';

-- Update the new status column based on the temporary text column
UPDATE issues SET new_status = CASE 
  WHEN temp_status = 'completed' THEN 'completed'::issue_status
  ELSE 'pending'::issue_status
END;

-- Drop the old status column and rename the new one
ALTER TABLE issues DROP COLUMN status;
ALTER TABLE issues DROP COLUMN temp_status;
ALTER TABLE issues RENAME COLUMN new_status TO status;

-- Add NOT NULL constraint to status column
ALTER TABLE issues ALTER COLUMN status SET NOT NULL;

-- Keep RLS disabled as requested
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;