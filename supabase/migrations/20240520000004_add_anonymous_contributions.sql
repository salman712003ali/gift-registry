-- Add allow_anonymous_contributions column to registries table
ALTER TABLE registries ADD COLUMN IF NOT EXISTS allow_anonymous_contributions BOOLEAN DEFAULT false;

-- Update RLS policies to include the new column
CREATE POLICY "Enable read access for all users" ON registries
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON registries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for registry owners" ON registries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for registry owners" ON registries
  FOR DELETE USING (auth.uid() = user_id); 