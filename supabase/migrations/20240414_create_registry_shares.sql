-- Create registry_shares table
CREATE TABLE IF NOT EXISTS registry_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_id UUID REFERENCES registries(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(registry_id, shared_with)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registry_shares_registry_id ON registry_shares(registry_id);
CREATE INDEX IF NOT EXISTS idx_registry_shares_shared_with ON registry_shares(shared_with);

-- Enable RLS
ALTER TABLE registry_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for registry_shares
CREATE POLICY "Registry owners can manage shares"
ON registry_shares FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = registry_shares.registry_id
        AND registries.user_id = auth.uid()
    )
);

CREATE POLICY "Shared users can view their shares"
ON registry_shares FOR SELECT
USING (shared_with = auth.uid());

-- Now let's update the registry policies to use the new table
DROP POLICY IF EXISTS "Anyone can view public registries" ON registries;

CREATE POLICY "Anyone can view public registries"
ON registries FOR SELECT
USING (
    is_private = false OR 
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM registry_shares 
        WHERE registry_id = registries.id 
        AND shared_with = auth.uid()
    )
); 