-- Performance Improvements: Add missing indexes and optimize existing ones
CREATE INDEX IF NOT EXISTS idx_gift_items_price ON gift_items(price);
CREATE INDEX IF NOT EXISTS idx_gift_items_is_purchased ON gift_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_registries_event_date ON registries(event_date);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Add new columns for enhanced features
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "contribution_alerts": true}'::jsonb,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE registries
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS thank_you_message TEXT,
ADD COLUMN IF NOT EXISTS custom_url_slug TEXT UNIQUE;

ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS thank_you_sent BOOLEAN DEFAULT false;

-- Create new tables for enhanced functionality
CREATE TABLE IF NOT EXISTS registry_co_owners (
    registry_id UUID REFERENCES registries(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"can_edit": true, "can_delete": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (registry_id, profile_id)
);

CREATE TABLE IF NOT EXISTS gift_item_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_registry_co_owners_profile ON registry_co_owners(profile_id);
CREATE INDEX IF NOT EXISTS idx_gift_item_images_item ON gift_item_images(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_registries_custom_url ON registries(custom_url_slug);

-- Enable RLS on new tables
ALTER TABLE registry_co_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Registry owners and co-owners can manage co-owners"
ON registry_co_owners
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM registries
        WHERE registries.id = registry_co_owners.registry_id
        AND (registries.user_id = auth.uid() OR registry_co_owners.profile_id = auth.uid())
    )
);

CREATE POLICY "Anyone can view gift item images"
ON gift_item_images
FOR SELECT USING (true);

CREATE POLICY "Registry owners can manage gift item images"
ON gift_item_images
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM gift_items
        JOIN registries ON gift_items.registry_id = registries.id
        WHERE gift_items.id = gift_item_images.gift_item_id
        AND registries.user_id = auth.uid()
    )
);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION calculate_registry_total(registry_id UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM gift_items
        WHERE registry_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_contribution_total(gift_item_id UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM contributions
        WHERE gift_item_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating reservation expiry
CREATE OR REPLACE FUNCTION check_reservation_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reserved_by IS NOT NULL AND NEW.reservation_expires_at IS NULL THEN
        NEW.reservation_expires_at := NOW() + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_expiry
    BEFORE INSERT OR UPDATE ON gift_items
    FOR EACH ROW
    EXECUTE FUNCTION check_reservation_expiry();

-- Create function to automatically generate custom URL slugs
CREATE OR REPLACE FUNCTION generate_custom_url_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_url_slug IS NULL THEN
        NEW.custom_url_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]', '-', 'g')) || '-' || 
                              SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_custom_url_slug
    BEFORE INSERT ON registries
    FOR EACH ROW
    EXECUTE FUNCTION generate_custom_url_slug();

-- Add default email templates
INSERT INTO email_templates (name, subject, content, variables) VALUES
('welcome', 'Welcome to Gift Registry!', 'Hello {{name}}, welcome to Gift Registry!', '{"name": "User''s name"}'::jsonb),
('contribution_received', 'New Contribution Received', 'You received a contribution of {{amount}} from {{contributor}}!', '{"amount": "Contribution amount", "contributor": "Contributor''s name"}'::jsonb),
('thank_you', 'Thank You for Your Contribution', 'Dear {{contributor}}, thank you for your contribution of {{amount}}!', '{"contributor": "Contributor''s name", "amount": "Contribution amount"}'::jsonb)
ON CONFLICT DO NOTHING; 