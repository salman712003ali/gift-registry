-- Drop existing foreign key constraints
ALTER TABLE registries 
  DROP CONSTRAINT IF EXISTS registries_user_id_fkey;

ALTER TABLE contributions
  DROP CONSTRAINT IF EXISTS contributions_user_id_fkey;

ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Recreate foreign key constraints with proper names
ALTER TABLE registries 
  ADD CONSTRAINT registries_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE contributions
  ADD CONSTRAINT contributions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Ensure RLS is enabled
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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