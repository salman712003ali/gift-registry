-- Add description column to gift_items table if it doesn't exist
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS description TEXT; 