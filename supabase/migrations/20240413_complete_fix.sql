-- Drop all existing tables in reverse order of dependencies
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS gift_items CASCADE;
DROP TABLE IF EXISTS registries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create registries table with all required columns
CREATE TABLE registries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  event_date DATE,
  is_private BOOLEAN DEFAULT false,
  privacy_settings JSONB DEFAULT '{
    "visibility": "public",
    "password": null,
    "require_contributor_info": true,
    "show_contributor_names": true,
    "allow_anonymous_contributions": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create gift_items table
CREATE TABLE gift_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registry_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contributions table
CREATE TABLE contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_item_id UUID NOT NULL,
  registry_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to ensure user exists
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    -- Check if user exists in public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
      -- Insert user into public.users
      INSERT INTO public.users (id, email, full_name)
      SELECT id, email, raw_user_meta_data->>'full_name'
      FROM auth.users
      WHERE id = user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle registry creation
CREATE OR REPLACE FUNCTION handle_registry_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user exists before creating registry
  PERFORM ensure_user_exists(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for registry creation
CREATE TRIGGER before_registry_insert
  BEFORE INSERT ON registries
  FOR EACH ROW
  EXECUTE FUNCTION handle_registry_creation();

-- Add foreign key constraints after tables are created
ALTER TABLE registries
ADD CONSTRAINT registries_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE gift_items
ADD CONSTRAINT gift_items_registry_id_fkey
FOREIGN KEY (registry_id) REFERENCES registries(id) ON DELETE CASCADE,
ADD CONSTRAINT gift_items_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE contributions
ADD CONSTRAINT contributions_gift_item_id_fkey
FOREIGN KEY (gift_item_id) REFERENCES gift_items(id) ON DELETE CASCADE,
ADD CONSTRAINT contributions_registry_id_fkey
FOREIGN KEY (registry_id) REFERENCES registries(id) ON DELETE CASCADE,
ADD CONSTRAINT contributions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id);

-- Create indexes
CREATE INDEX registries_user_id_idx ON registries(user_id);
CREATE INDEX gift_items_registry_id_idx ON gift_items(registry_id);
CREATE INDEX gift_items_user_id_idx ON gift_items(user_id);
CREATE INDEX contributions_gift_item_id_idx ON contributions(gift_item_id);
CREATE INDEX contributions_registry_id_idx ON contributions(registry_id);
CREATE INDEX contributions_user_id_idx ON contributions(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create RLS policies for registries table
CREATE POLICY "Enable read access for all users" ON registries
  FOR SELECT
  TO authenticated
  USING (NOT is_private OR user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON registries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON registries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON registries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for gift_items table
CREATE POLICY "Enable read access for all users" ON gift_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON gift_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON gift_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON gift_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for contributions table
CREATE POLICY "Enable read access for all users" ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registries_updated_at
  BEFORE UPDATE ON registries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_items_updated_at
  BEFORE UPDATE ON gift_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 