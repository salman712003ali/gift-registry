-- Temporarily disable RLS to avoid conflicts
ALTER TABLE contributions DISABLE ROW LEVEL SECURITY;

-- Create a basic policy that allows all operations for now
-- We can make it more restrictive later once we confirm contributions are working
CREATE POLICY "temp_allow_all_contributions"
ON contributions
FOR ALL
USING (true)
WITH CHECK (true);

-- Re-enable RLS with the new permissive policy
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Ensure we have all necessary columns
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contributor_name TEXT,
ADD COLUMN IF NOT EXISTS registry_id UUID REFERENCES registries(id) ON DELETE CASCADE; 