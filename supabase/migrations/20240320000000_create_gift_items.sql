-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_gift_items_updated_at ON gift_items;

-- Create gift_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS gift_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  image_url TEXT,
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on registry_id for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_gift_items_registry_id ON gift_items(registry_id);

-- Enable Row Level Security
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to gift items" ON gift_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert gift items" ON gift_items;
DROP POLICY IF EXISTS "Allow registry owners to update their gift items" ON gift_items;
DROP POLICY IF EXISTS "Allow registry owners to delete their gift items" ON gift_items;

-- Create policies
CREATE POLICY "Allow public read access to gift items"
  ON gift_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert gift items"
  ON gift_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow registry owners to update their gift items"
  ON gift_items FOR UPDATE
  TO authenticated
  USING (
    registry_id IN (
      SELECT id FROM registries 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow registry owners to delete their gift items"
  ON gift_items FOR DELETE
  TO authenticated
  USING (
    registry_id IN (
      SELECT id FROM registries 
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gift_items_updated_at
  BEFORE UPDATE ON gift_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 