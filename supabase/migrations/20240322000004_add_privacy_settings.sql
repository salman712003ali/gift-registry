-- Add privacy settings to registries table
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "visibility": "public",
  "password": null,
  "require_contributor_info": true,
  "show_contributor_names": true,
  "allow_anonymous_contributions": false
}'::jsonb;

-- Update RLS policies to handle privacy settings
DROP POLICY IF EXISTS "Public can read registries" ON registries;
CREATE POLICY "Public can read registries"
  ON registries
  FOR SELECT
  TO public
  USING (
    privacy_settings->>'visibility' = 'public' OR
    auth.uid() = user_id
  );

-- Add index for faster privacy-based queries
CREATE INDEX IF NOT EXISTS registries_privacy_settings_idx ON registries((privacy_settings->>'visibility')); 