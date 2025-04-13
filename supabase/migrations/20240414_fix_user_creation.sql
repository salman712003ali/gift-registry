-- Create a stored procedure to handle user creation
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
  user_id uuid,
  user_email text,
  user_name text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (user_id, user_email, user_name)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_user_if_not_exists TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can upsert their own data" ON public.users;

-- Create simplified policies
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.registries TO authenticated;

-- Ensure the registries table has correct policies
DROP POLICY IF EXISTS "Users can create registries" ON public.registries;
CREATE POLICY "Users can create registries"
ON public.registries FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view public registries" ON public.registries;
CREATE POLICY "Anyone can view public registries"
ON public.registries FOR SELECT
USING (
  (privacy_settings->>'is_private')::boolean = false OR 
  auth.uid() = user_id
); 