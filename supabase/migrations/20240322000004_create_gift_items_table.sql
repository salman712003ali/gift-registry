-- Create gift_items table
CREATE TABLE gift_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registry_id UUID REFERENCES registries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on registry_id for faster queries
CREATE INDEX gift_items_registry_id_idx ON gift_items(registry_id);

-- Enable Row Level Security
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read gift items for their registries
CREATE POLICY "Users can read gift items for their registries"
  ON gift_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert gift items for their registries
CREATE POLICY "Users can insert gift items for their registries"
  ON gift_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update gift items for their registries
CREATE POLICY "Users can update gift items for their registries"
  ON gift_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete gift items for their registries
CREATE POLICY "Users can delete gift items for their registries"
  ON gift_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  );

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_gift_items_updated_at
  BEFORE UPDATE ON gift_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 