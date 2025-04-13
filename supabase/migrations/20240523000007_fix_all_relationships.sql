-- Ensure all tables exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
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
  privacy_settings JSONB DEFAULT jsonb_build_object(
    'is_private', false,
    'show_contributor_names', true,
    'allow_anonymous_contributions', true
  )
);

CREATE TABLE IF NOT EXISTS gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id UUID REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  url TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_purchased BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE NOT NULL,
  registry_id UUID REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contributor_name TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix contributions table relationships
-- Update profile_id from user_id if not set
UPDATE contributions
SET profile_id = user_id
WHERE profile_id IS NULL AND user_id IS NOT NULL;

-- Create helpful views for backward compatibility
CREATE OR REPLACE VIEW contributions_with_users AS
SELECT 
    c.id,
    c.gift_item_id,
    c.registry_id,
    c.user_id,
    c.profile_id,
    c.amount,
    c.message,
    c.created_at,
    COALESCE(p.full_name, c.contributor_name) as display_name,
    p.email as user_email
FROM 
    contributions c
LEFT JOIN 
    profiles p ON c.profile_id = p.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_items_registry_id ON gift_items(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Grant access to views
GRANT SELECT ON contributions_with_users TO authenticated, anon, service_role; 