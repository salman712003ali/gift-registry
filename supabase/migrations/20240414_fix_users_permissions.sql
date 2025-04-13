-- Drop existing policies on users table if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies for users table
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Create policy for registry creation
CREATE POLICY "Users can create registries"
ON registries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for viewing public registries
CREATE POLICY "Anyone can view public registries"
ON registries FOR SELECT
USING (
  is_private = false OR 
  auth.uid() = user_id
); 