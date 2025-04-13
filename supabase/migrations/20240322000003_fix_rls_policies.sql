-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read their own registries" ON registries;
DROP POLICY IF EXISTS "Users can insert their own registries" ON registries;
DROP POLICY IF EXISTS "Users can update their own registries" ON registries;
DROP POLICY IF EXISTS "Users can delete their own registries" ON registries;
DROP POLICY IF EXISTS "Public can read registries" ON registries;

-- Create new policies
-- Allow users to read their own registries
CREATE POLICY "Users can read their own registries"
  ON registries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own registries
CREATE POLICY "Users can insert their own registries"
  ON registries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own registries
CREATE POLICY "Users can update their own registries"
  ON registries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own registries
CREATE POLICY "Users can delete their own registries"
  ON registries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public to read registries (for viewing shared registries)
CREATE POLICY "Public can read registries"
  ON registries
  FOR SELECT
  TO public
  USING (true); 