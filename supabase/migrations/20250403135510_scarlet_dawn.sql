/*
  # Add issue history tracking

  1. New Tables
    - `issue_history`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `status` (issue_status)
      - `changed_at` (timestamptz)
      - `changed_by` (uuid, references profiles)

  2. Security
    - Enable RLS on issue_history table
    - Add policies for authenticated users
*/

-- Create issue history table
CREATE TABLE IF NOT EXISTS issue_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  status issue_status NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT issue_history_issue_id_changed_at_key UNIQUE (issue_id, changed_at)
);

-- Enable RLS
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read issue history"
  ON issue_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert issue history"
  ON issue_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by);

-- Create function to automatically add history entry when issue status changes
CREATE OR REPLACE FUNCTION add_issue_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR NEW.status != OLD.status THEN
    INSERT INTO issue_history (issue_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_issue_status_change ON issues;
CREATE TRIGGER on_issue_status_change
  AFTER INSERT OR UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION add_issue_history();

-- Add initial history entries for existing issues
INSERT INTO issue_history (issue_id, status, changed_by, changed_at)
SELECT 
  id,
  status,
  user_id,
  created_at
FROM issues
ON CONFLICT (issue_id, changed_at) DO NOTHING;