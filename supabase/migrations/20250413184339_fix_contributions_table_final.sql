-- Ensure all required columns exist in the contributions table
DO $$
BEGIN
    -- Add is_anonymous column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE contributions ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
    END IF;

    -- Add profile_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE contributions ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add contributor_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'contributor_name'
    ) THEN
        ALTER TABLE contributions ADD COLUMN contributor_name TEXT;
    END IF;

    -- Add registry_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'registry_id'
    ) THEN
        ALTER TABLE contributions ADD COLUMN registry_id UUID REFERENCES registries(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);

-- Update RLS policies
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to contributions" ON contributions;
DROP POLICY IF EXISTS "Allow public insert access to contributions" ON contributions;
DROP POLICY IF EXISTS "Allow registry owners to delete contributions" ON contributions;
DROP POLICY IF EXISTS "Users can view contributions" ON contributions;
DROP POLICY IF EXISTS "Users can create contributions" ON contributions;
DROP POLICY IF EXISTS "Users can update contributions" ON contributions;
DROP POLICY IF EXISTS "Users can delete contributions" ON contributions;

-- Create new policies that allow both authenticated and anonymous contributions
CREATE POLICY "Anyone can view contributions"
ON contributions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create contributions"
ON contributions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Registry owners can manage contributions"
ON contributions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = contributions.registry_id
        AND registries.user_id = auth.uid()
    )
); 