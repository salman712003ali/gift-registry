-- Create tables in correct order
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    occasion TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS gift_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_id UUID REFERENCES registries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    url TEXT,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
    registry_id UUID REFERENCES registries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    contributor_name TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON contributions(profile_id);

-- Set up minimal RLS policies
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "temp_allow_all_contributions" ON contributions;

-- Create a permissive policy for contributions
CREATE POLICY "temp_allow_all_contributions"
ON contributions FOR ALL
USING (true)
WITH CHECK (true); 