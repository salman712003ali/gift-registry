-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);

-- Create the updated function
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        -- Check if user exists in public.profiles
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
            -- Insert user into public.profiles
            INSERT INTO public.profiles (
                id,
                first_name,
                last_name,
                email,
                created_at,
                updated_at
            )
            SELECT 
                id,
                COALESCE(raw_user_meta_data->>'first_name', ''),
                COALESCE(raw_user_meta_data->>'last_name', ''),
                email,
                NOW(),
                NOW()
            FROM auth.users
            WHERE id = user_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'User does not exist in auth.users';
    END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated; 