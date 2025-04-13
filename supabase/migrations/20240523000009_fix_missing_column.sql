-- First add the missing column if it doesn't exist
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS contributor_name TEXT;

-- Drop the view if it exists
DROP VIEW IF EXISTS contributions_with_users;

-- Recreate with explicit columns to avoid duplicates
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
    c.contributor_name,
    p.full_name AS user_full_name,
    p.email AS user_email
FROM 
    contributions c
LEFT JOIN 
    profiles p ON c.profile_id = p.id;

-- Grant access to the view
GRANT SELECT ON contributions_with_users TO authenticated, anon, service_role; 