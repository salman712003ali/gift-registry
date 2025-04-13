-- Drop existing policies on auth.users table if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update their own data" ON auth.users;

-- Enable RLS on auth.users table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create new policies for auth.users table
CREATE POLICY "Users can view their own data"
ON auth.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON auth.users FOR UPDATE
USING (auth.uid() = id);

-- Create policy for registry creation
DROP POLICY IF EXISTS "Users can create registries" ON registries;
CREATE POLICY "Users can create registries"
ON registries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for viewing public registries
DROP POLICY IF EXISTS "Anyone can view public registries" ON registries;
CREATE POLICY "Anyone can view public registries"
ON registries FOR SELECT
USING (
  is_private = false OR 
  auth.uid() = user_id
); 