-- First, drop the existing foreign key constraint
ALTER TABLE registries
  DROP CONSTRAINT IF EXISTS registries_user_id_fkey;

-- Update the foreign key to reference profiles instead of auth.users
ALTER TABLE registries
  ADD CONSTRAINT registries_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Update RLS policies to use profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON registries;
DROP POLICY IF EXISTS "Enable update for registry owners" ON registries;
DROP POLICY IF EXISTS "Enable delete for registry owners" ON registries;

CREATE POLICY "Enable insert for authenticated users" ON registries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.id = registries.user_id
    )
  );

CREATE POLICY "Enable update for registry owners" ON registries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.id = registries.user_id
    )
  );

CREATE POLICY "Enable delete for registry owners" ON registries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.id = registries.user_id
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id); 