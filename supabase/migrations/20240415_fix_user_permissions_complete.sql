-- Drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_if_not_exists(uuid, text, text);
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can upsert their own data" ON public.users;

-- Recreate the users table
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "contribution_notifications": true,
        "registry_updates": true
    }'::jsonb
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous')
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.registries TO authenticated;
GRANT ALL ON TABLE public.gift_items TO authenticated;
GRANT ALL ON TABLE public.contributions TO authenticated;

-- Create function to ensure user exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
        INSERT INTO public.users (id, email, full_name)
        SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'full_name', 'Anonymous')
        FROM auth.users
        WHERE id = user_id;
    END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated; 