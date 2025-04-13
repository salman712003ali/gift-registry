-- Make user_id nullable and add contributor_name column
ALTER TABLE contributions 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS contributor_name TEXT;

-- Update existing contributions to have a default contributor_name if user_id is set
UPDATE contributions c
SET contributor_name = u.full_name
FROM users u
WHERE c.user_id = u.id
  AND c.contributor_name IS NULL; 