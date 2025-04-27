-- First, make sure is_purchased column exists in gift_items table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gift_items'
        AND column_name = 'is_purchased'
    ) THEN
        ALTER TABLE public.gift_items ADD COLUMN is_purchased BOOLEAN DEFAULT false;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_gift_items_is_purchased ON public.gift_items(is_purchased);
        
        -- Create or replace RLS policy to allow marking items as purchased
        DROP POLICY IF EXISTS "Registry owners can mark items as purchased" ON public.gift_items;
        CREATE POLICY "Registry owners can mark items as purchased" 
        ON public.gift_items
        FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM registries
                WHERE registries.id = gift_items.registry_id
                AND registries.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Create a view that combines registry details with profile information
CREATE OR REPLACE VIEW registry_details AS
SELECT 
    r.id,
    r.title,
    r.description,
    r.event_date,
    r.is_private,
    r.show_contributor_names,
    r.created_at,
    r.updated_at,
    r.user_id as owner_id,
    p.full_name as owner_name,
    p.avatar_url as owner_avatar,
    p.email as owner_email,
    COUNT(DISTINCT gi.id) as total_items,
    COUNT(DISTINCT CASE WHEN gi.is_purchased THEN gi.id END) as purchased_items,
    COUNT(DISTINCT c.id) as total_contributions,
    SUM(c.amount) as total_contribution_amount
FROM 
    registries r
LEFT JOIN 
    profiles p ON r.user_id = p.id
LEFT JOIN
    gift_items gi ON r.id = gi.registry_id
LEFT JOIN
    contributions c ON r.id = c.registry_id
GROUP BY
    r.id, p.id;

-- Add Row Level Security (RLS) policy to the view
ALTER VIEW registry_details OWNER TO postgres;

GRANT SELECT ON registry_details TO authenticated;
GRANT SELECT ON registry_details TO anon;

-- Comment on the view
COMMENT ON VIEW registry_details IS 'View that combines registry details with owner profile information and summary statistics';

-- Create a view for gift item analytics
CREATE OR REPLACE VIEW gift_item_analytics AS
SELECT
    gi.id,
    gi.name,
    gi.price,
    gi.quantity,
    gi.registry_id,
    gi.is_purchased,
    gi.created_at,
    gi.updated_at,
    r.title as registry_title,
    COUNT(DISTINCT c.id) as contribution_count,
    COALESCE(SUM(c.amount), 0) as total_contribution_amount,
    CASE 
        WHEN gi.is_purchased THEN 100
        WHEN gi.price * gi.quantity > 0 THEN 
            LEAST(COALESCE(SUM(c.amount), 0) / (gi.price * gi.quantity) * 100, 100)
        ELSE 0
    END as percent_funded
FROM
    gift_items gi
LEFT JOIN
    registries r ON gi.registry_id = r.id
LEFT JOIN
    contributions c ON gi.id = c.gift_item_id
GROUP BY
    gi.id, r.title;

-- Add Row Level Security (RLS) policy to the view
ALTER VIEW gift_item_analytics OWNER TO postgres;

GRANT SELECT ON gift_item_analytics TO authenticated;
GRANT SELECT ON gift_item_analytics TO anon;

-- Comment on the view
COMMENT ON VIEW gift_item_analytics IS 'View that provides analytics for gift items with funding and contribution data';
