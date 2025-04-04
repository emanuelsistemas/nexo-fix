/*
  # Add image upload support

  1. Changes
    - Add image_url column to issues table to store image URLs
*/

-- Add image_url column to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS image_url text;