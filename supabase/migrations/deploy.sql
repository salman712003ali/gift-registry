-- Gift Registry Database Setup
-- Copy and paste this entire file into your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_date DATE,
    is_private BOOLEAN DEFAULT false,
    show_contributor_names BOOLEAN DEFAULT true,
    custom_url_slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    privacy_settings JSONB DEFAULT '{"is_private": false}'::JSONB,
    notification_preferences JSONB DEFAULT '{"emailNotifications": true}'::JSONB
);

CREATE TABLE IF NOT EXISTS gift_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registry_id UUID REFERENCES registries ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_purchased BOOLEAN DEFAULT FALSE,
    reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reservation_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_url TEXT,
    retailer TEXT,
    brand TEXT,
    category TEXT,
    rating NUMERIC,
    reviews_count INTEGER,
    availability TEXT,
    shipping_info TEXT
);

CREATE TABLE IF NOT EXISTS gift_item_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gift_item_id UUID REFERENCES gift_items ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registry_id UUID REFERENCES registries ON DELETE CASCADE,
    gift_item_id UUID REFERENCES gift_items ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    contributor_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id);
CREATE INDEX IF NOT EXISTS idx_registries_profile_id ON registries(profile_id);
CREATE INDEX IF NOT EXISTS idx_registries_custom_url ON registries(custom_url_slug);
CREATE INDEX IF NOT EXISTS idx_registries_event_date ON registries(event_date);
CREATE INDEX IF NOT EXISTS idx_gift_items_registry_id ON gift_items(registry_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_user_id ON gift_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_is_purchased ON gift_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_gift_items_price ON gift_items(price);
CREATE INDEX IF NOT EXISTS idx_gift_items_product_search ON gift_items(name, retailer, brand, category);
CREATE INDEX IF NOT EXISTS idx_gift_item_images_item ON gift_item_images(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public registries are viewable by everyone"
ON registries FOR SELECT
USING (
    (NOT is_private)
    OR user_id = auth.uid()
);

CREATE POLICY "Users can create their own registries"
ON registries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registries"
ON registries FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own registries"
ON registries FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Gift items are viewable by everyone if registry is public"
ON gift_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = gift_items.registry_id
        AND (NOT registries.is_private OR registries.user_id = auth.uid())
    )
);

CREATE POLICY "Registry owners can manage gift items"
ON gift_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = gift_items.registry_id
        AND registries.user_id = auth.uid()
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registries_updated_at
    BEFORE UPDATE ON registries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_items_updated_at
    BEFORE UPDATE ON gift_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO profiles (id, full_name, email)
SELECT id, email, email
FROM auth.users
ON CONFLICT (id) DO NOTHING; 