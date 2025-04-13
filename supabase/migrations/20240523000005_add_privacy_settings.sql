-- Add privacy_settings JSONB column to registries if it doesn't exist
ALTER TABLE registries 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT jsonb_build_object(
  'is_private', false,
  'show_contributor_names', true,
  'allow_anonymous_contributions', true
);

-- Create an index for faster searches on privacy_settings->is_private
CREATE INDEX IF NOT EXISTS idx_registries_privacy_settings_is_private 
ON registries ((privacy_settings->>'is_private'));

-- Update RLS policies for registries
DROP POLICY IF EXISTS "Enable read access for all users" ON registries;
CREATE POLICY "Enable read access for all users" ON registries
  FOR SELECT USING (
    -- Users can view public registries OR their own registries
    (privacy_settings->>'is_private')::boolean = false OR 
    auth.uid() = user_id
);

-- Add a comment to the column
COMMENT ON COLUMN registries.privacy_settings IS 
'JSON object containing privacy settings for the registry: 
{
  "is_private": boolean, 
  "show_contributor_names": boolean,
  "allow_anonymous_contributions": boolean
}';

-- For any existing registries with NULL privacy_settings, set the default values
UPDATE registries 
SET privacy_settings = jsonb_build_object(
  'is_private', false,
  'show_contributor_names', true,
  'allow_anonymous_contributions', true
)
WHERE privacy_settings IS NULL; 