-- Gift Registry Database Setup
-- Copy and paste this entire file into your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    privacy_settings JSONB DEFAULT '{"isPublic": true}'::JSONB,
    notification_preferences JSONB DEFAULT '{"emailNotifications": true}'::JSONB
);

CREATE TABLE IF NOT EXISTS gift_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registry_id UUID REFERENCES registries ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_purchased BOOLEAN DEFAULT FALSE,
    product_url TEXT,
    retailer TEXT,
    brand TEXT,
    category TEXT,
    rating NUMERIC,
    reviews_count INTEGER,
    availability TEXT,
    shipping_info TEXT
);

CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gift_item_id UUID REFERENCES gift_items ON DELETE CASCADE,
    contributor_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registries_owner ON registries(owner_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_registry ON gift_items(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_item ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_product_search ON gift_items (name, retailer, brand, category);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Public registries are viewable by everyone"
ON registries FOR SELECT
USING (
    (privacy_settings->>'isPublic')::boolean = true
    OR owner_id = auth.uid()
);

CREATE POLICY "Users can create registries"
ON registries FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Registry owners can update their registries"
ON registries FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Registry owners can delete their registries"
ON registries FOR DELETE
USING (owner_id = auth.uid());

CREATE POLICY "Gift items are viewable by registry viewers"
ON gift_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = gift_items.registry_id
        AND (
            (registries.privacy_settings->>'isPublic')::boolean = true
            OR registries.owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Registry owners can manage gift items"
ON gift_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = gift_items.registry_id
        AND registries.owner_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view contributions"
ON contributions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create contributions"
ON contributions FOR INSERT
WITH CHECK (true);

-- Create functions
CREATE OR REPLACE FUNCTION search_products(search_query text)
RETURNS SETOF gift_items
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT ON (id) *
  FROM gift_items
  WHERE 
    name ILIKE '%' || search_query || '%'
    OR brand ILIKE '%' || search_query || '%'
    OR category ILIKE '%' || search_query || '%'
  ORDER BY id, rating DESC NULLS LAST, price ASC
  LIMIT 30;
$$;

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_registries_updated_at
    BEFORE UPDATE ON registries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gift_items_updated_at
    BEFORE UPDATE ON gift_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert initial data
INSERT INTO profiles (id, full_name, avatar_url)
SELECT id, email, ''
FROM auth.users
ON CONFLICT (id) DO NOTHING; 