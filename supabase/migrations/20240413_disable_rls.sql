-- Temporarily disable RLS on gift_items table
ALTER TABLE gift_items DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON gift_items; 