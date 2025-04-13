-- Create contributions table if it doesn't exist
CREATE TABLE IF NOT EXISTS contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
  registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  contributor_name TEXT NOT NULL,
  contributor_email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster lookups if they don't exist
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);

-- Enable Row Level Security
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to contributions" ON contributions;
DROP POLICY IF EXISTS "Allow public insert access to contributions" ON contributions;
DROP POLICY IF EXISTS "Allow registry owners to delete contributions" ON contributions;

-- Create policies
CREATE POLICY "Allow public read access to contributions"
  ON contributions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to contributions"
  ON contributions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow registry owners to delete contributions"
  ON contributions FOR DELETE
  TO authenticated
  USING (
    registry_id IN (
      SELECT id FROM registries 
      WHERE user_id = auth.uid()
    )
  );

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_contributions_updated_at ON contributions;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 