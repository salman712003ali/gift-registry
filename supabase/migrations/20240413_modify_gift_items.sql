-- Temporarily modify gift_items table to allow NULL user_id
ALTER TABLE gift_items ALTER COLUMN user_id DROP NOT NULL;

-- Disable RLS if not already disabled
ALTER TABLE gift_items DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON gift_items; 