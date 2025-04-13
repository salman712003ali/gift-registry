-- Add user_id column to gift_items table
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing rows to have a user_id (if any)
-- This is a one-time operation for existing data
UPDATE gift_items
SET user_id = (
  SELECT user_id 
  FROM registries 
  WHERE registries.id = gift_items.registry_id
)
WHERE user_id IS NULL;

-- Make user_id column required
ALTER TABLE gift_items
ALTER COLUMN user_id SET NOT NULL; 