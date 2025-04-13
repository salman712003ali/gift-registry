-- Create registries table
CREATE TABLE registries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  occasion TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX registries_user_id_idx ON registries(user_id);

-- Enable Row Level Security
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own registries
CREATE POLICY "Users can read their own registries"
  ON registries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own registries
CREATE POLICY "Users can insert their own registries"
  ON registries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own registries
CREATE POLICY "Users can update their own registries"
  ON registries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own registries
CREATE POLICY "Users can delete their own registries"
  ON registries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_registries_updated_at
  BEFORE UPDATE ON registries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 