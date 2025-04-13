-- Check if user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'registries'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE registries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'registries'
        AND indexname = 'registries_user_id_idx'
    ) THEN
        CREATE INDEX registries_user_id_idx ON registries(user_id);
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own registries" ON registries;
DROP POLICY IF EXISTS "Users can insert their own registries" ON registries;
DROP POLICY IF EXISTS "Users can update their own registries" ON registries;
DROP POLICY IF EXISTS "Users can delete their own registries" ON registries;

-- Create new policies
CREATE POLICY "Users can read their own registries"
  ON registries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registries"
  ON registries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registries"
  ON registries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own registries"
  ON registries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_registries_updated_at ON registries;

-- Create the trigger
CREATE TRIGGER update_registries_updated_at
  BEFORE UPDATE ON registries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 