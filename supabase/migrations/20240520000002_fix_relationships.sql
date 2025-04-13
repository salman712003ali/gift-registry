-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS contributions DROP CONSTRAINT IF EXISTS contributions_gift_item_id_fkey;
ALTER TABLE IF EXISTS contributions DROP CONSTRAINT IF EXISTS contributions_registry_id_fkey;
ALTER TABLE IF EXISTS contributions DROP CONSTRAINT IF EXISTS contributions_user_id_fkey;
ALTER TABLE IF EXISTS comments DROP CONSTRAINT IF EXISTS comments_gift_item_id_fkey;
ALTER TABLE IF EXISTS comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Recreate the contributions table with proper relationships
CREATE TABLE IF NOT EXISTS contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate the comments table with proper relationships
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_gift_item_id ON comments(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Enable Row Level Security
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contributions
CREATE POLICY "Enable read access for all users" ON contributions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for comments
CREATE POLICY "Enable read access for all users" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for comment owners" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for comment owners" ON comments
  FOR DELETE USING (auth.uid() = user_id); 