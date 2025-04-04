/*
  # Add image support to issues

  1. Changes
    - Add image_url column to issues table to store uploaded image URLs
    - Update existing records to have null image_url
*/

-- Add image_url column to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS image_url text;