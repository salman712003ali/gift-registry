-- 1. Add the privacy_settings column to registries if it doesn't exist
ALTER TABLE registries 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT jsonb_build_object(
  'is_private', false,
  'show_contributor_names', true,
  'allow_anonymous_contributions', true
);

-- 2. Update existing registries with default privacy settings
UPDATE registries 
SET privacy_settings = jsonb_build_object(
  'is_private', false,
  'show_contributor_names', true,
  'allow_anonymous_contributions', true
)
WHERE privacy_settings IS NULL;

-- 3. Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_registries_privacy_settings_is_private 
ON registries ((privacy_settings->>'is_private'));

-- 4. Add the profile_id column to contributions if needed
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 5. Add the contributor_name column to contributions if needed
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS contributor_name TEXT;

-- 6. Update profile_id from user_id for existing records
UPDATE contributions
SET profile_id = user_id
WHERE profile_id IS NULL AND user_id IS NOT NULL;

-- 7. Drop and recreate the view with correct columns
DROP VIEW IF EXISTS contributions_with_users;

CREATE VIEW contributions_with_users AS
SELECT 
    c.id,
    c.gift_item_id,
    c.registry_id,
    c.user_id,
    c.profile_id,
    c.contributor_name,
    c.amount,
    c.message,
    c.created_at,
    p.full_name AS user_full_name,
    p.email AS user_email
FROM 
    contributions c
LEFT JOIN 
    profiles p ON c.profile_id = p.id;

-- 8. Grant permissions to the view
GRANT SELECT ON contributions_with_users TO authenticated, anon, service_role; 