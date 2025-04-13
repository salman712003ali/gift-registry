-- Fix contributions relationship 
-- First, identify if the foreign key exists and its name
DO $$
DECLARE
    fk_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'contributions'
        AND constraint_name LIKE '%user_id%'
    ) INTO fk_exists;

    IF fk_exists THEN
        -- Drop the existing foreign key if it exists
        EXECUTE 'ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_user_id_fkey';
    END IF;
END $$;

-- Add the profiles_id column if it doesn't exist
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update profile_id from user_id if needed
UPDATE contributions
SET profile_id = user_id
WHERE profile_id IS NULL AND user_id IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON contributions(profile_id);

-- Check if the API is trying to relate contributions with users and fix that
-- Create a view that mimics the old relationship for backward compatibility
CREATE OR REPLACE VIEW contributions_with_users AS
SELECT 
    c.*,
    p.email,
    p.full_name
FROM 
    contributions c
LEFT JOIN 
    profiles p ON c.profile_id = p.id;

-- Grant access to the view
GRANT SELECT ON contributions_with_users TO authenticated, anon, service_role; 