-- Add missing columns to registries table
ALTER TABLE registries 
  ADD COLUMN IF NOT EXISTS allow_anonymous_contributions BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS occasion TEXT;

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON registries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON registries;
DROP POLICY IF EXISTS "Enable update for registry owners" ON registries;
DROP POLICY IF EXISTS "Enable delete for registry owners" ON registries;

CREATE POLICY "Enable read access for all users" ON registries
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON registries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for registry owners" ON registries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for registry owners" ON registries
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id);
CREATE INDEX IF NOT EXISTS idx_registries_occasion ON registries(occasion);
CREATE INDEX IF NOT EXISTS idx_registries_is_private ON registries(is_private); 