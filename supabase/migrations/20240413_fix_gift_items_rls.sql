-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON gift_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON gift_items;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON gift_items;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON gift_items;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users" ON gift_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON gift_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users based on user_id" ON gift_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON gift_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 