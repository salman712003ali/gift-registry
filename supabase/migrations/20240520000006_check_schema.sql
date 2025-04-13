-- Drop existing tables if they exist
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS gift_items CASCADE;
DROP TABLE IF EXISTS registries CASCADE;

-- Create registries table with all required columns
CREATE TABLE registries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  show_contributor_names BOOLEAN DEFAULT true,
  allow_anonymous_contributions BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create gift_items table
CREATE TABLE gift_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  product_url TEXT,
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contributions table
CREATE TABLE contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_registries_user_id ON registries(user_id);
CREATE INDEX idx_registries_occasion ON registries(occasion);
CREATE INDEX idx_registries_is_private ON registries(is_private);
CREATE INDEX idx_gift_items_registry_id ON gift_items(registry_id);
CREATE INDEX idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_comments_gift_item_id ON comments(gift_item_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Enable RLS
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON registries
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON registries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for registry owners" ON registries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for registry owners" ON registries
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON gift_items
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON gift_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM registries
    WHERE registries.id = gift_items.registry_id
    AND registries.user_id = auth.uid()
  ));

CREATE POLICY "Enable update for registry owners" ON gift_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM registries
    WHERE registries.id = gift_items.registry_id
    AND registries.user_id = auth.uid()
  ));

CREATE POLICY "Enable delete for registry owners" ON gift_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM registries
    WHERE registries.id = gift_items.registry_id
    AND registries.user_id = auth.uid()
  ));

CREATE POLICY "Enable read access for all users" ON contributions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for comment owners" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for comment owners" ON comments
  FOR DELETE USING (auth.uid() = user_id); 