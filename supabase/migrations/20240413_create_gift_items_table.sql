-- Create gift_items table
CREATE TABLE IF NOT EXISTS gift_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS gift_items_registry_id_idx ON gift_items(registry_id);
CREATE INDEX IF NOT EXISTS gift_items_user_id_idx ON gift_items(user_id);

-- Enable Row Level Security
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for authenticated users" ON gift_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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