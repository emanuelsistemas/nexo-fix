/*
  # Create storage bucket for issue images

  1. Storage Setup
    - Create 'issue-images' bucket for storing issue-related images
    - Enable public access for authenticated users
  
  2. Security
    - Add policies to allow authenticated users to:
      - Upload images
      - Read images
      - Update their own images
      - Delete their own images
*/

-- Create a new storage bucket for issue images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images'
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to read images
CREATE POLICY "Allow authenticated users to read images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'issue-images');

-- Policy to allow users to update their own images
CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'issue-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'issue-images' AND owner = auth.uid());

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'issue-images' AND owner = auth.uid());