-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON gift_items;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON gift_items;

-- Enable RLS on gift_items table
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON gift_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON gift_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for own items"
ON gift_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for own items"
ON gift_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 