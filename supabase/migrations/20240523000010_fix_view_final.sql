-- This is the final fix for the contributions_with_users view
-- Make sure the contributor_name column exists first
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS contributor_name TEXT;

-- Drop any existing view
DROP VIEW IF EXISTS contributions_with_users;

-- Create the view with exactly matching column names from the table
CREATE VIEW contributions_with_users AS
SELECT 
    c.id,
    c.gift_item_id,
    c.registry_id,
    c.user_id,
    c.profile_id,
    c.contributor_name,
    c.amount,
    c.message,
    c.created_at,
    -- Add additional columns with aliases to avoid conflicts
    p.full_name AS user_full_name,
    p.email AS user_email
FROM 
    contributions c
LEFT JOIN 
    profiles p ON c.profile_id = p.id;

-- Grant appropriate permissions
GRANT SELECT ON contributions_with_users TO authenticated, anon, service_role; 