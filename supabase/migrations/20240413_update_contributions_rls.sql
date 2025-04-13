-- Enable RLS on contributions table
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON contributions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON contributions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON contributions;
DROP POLICY IF EXISTS "Enable read access for all users" ON contributions;

-- Policy to allow anyone to create contributions
CREATE POLICY "Enable insert access for all users"
ON contributions
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registries r
    WHERE r.id = registry_id
    AND (
      r.is_private = false 
      OR (auth.uid() IS NOT NULL AND r.user_id = auth.uid())
    )
  )
);

-- Policy to allow users to view contributions for registries they can access
CREATE POLICY "Enable read access for all users"
ON contributions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM registries r
    WHERE r.id = registry_id
    AND (
      r.is_private = false 
      OR (auth.uid() IS NOT NULL AND r.user_id = auth.uid())
    )
  )
); 