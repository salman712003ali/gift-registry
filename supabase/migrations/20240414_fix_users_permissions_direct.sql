-- Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.registries TO authenticated;
GRANT ALL ON TABLE public.gift_items TO authenticated;
GRANT ALL ON TABLE public.contributions TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

-- Create new policies for users table
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policy for registry creation
DROP POLICY IF EXISTS "Users can create registries" ON public.registries;
CREATE POLICY "Users can create registries"
ON public.registries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for viewing public registries
DROP POLICY IF EXISTS "Anyone can view public registries" ON public.registries;
CREATE POLICY "Anyone can view public registries"
ON public.registries FOR SELECT
USING (
  (privacy_settings->>'is_private')::boolean = false OR 
  auth.uid() = user_id
); 