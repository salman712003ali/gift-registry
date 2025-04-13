-- Enable RLS on registries table
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON registries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON registries;
DROP POLICY IF EXISTS "Enable update for owners" ON registries;
DROP POLICY IF EXISTS "Enable delete for owners" ON registries;

-- Policy to allow anyone to read public registries and owners to read their private registries
CREATE POLICY "Enable read access for all users"
ON registries
FOR SELECT
TO public
USING (
  is_private = false 
  OR (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
);

-- Policy to allow authenticated users to create registries
CREATE POLICY "Enable insert for authenticated users"
ON registries
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Policy to allow owners to update their registries
CREATE POLICY "Enable update for owners"
ON registries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow owners to delete their registries
CREATE POLICY "Enable delete for owners"
ON registries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 