-- First, ensure we have a backup of any existing contributor names
CREATE TABLE IF NOT EXISTS public.temp_contributions_backup AS
SELECT * FROM public.contributions;

-- Drop the contributor_name column and add user_id if it doesn't exist
DO $$ 
BEGIN
    -- Remove contributor_name column if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'contributor_name'
    ) THEN
        ALTER TABLE public.contributions DROP COLUMN contributor_name;
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.contributions 
        ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS policies for the contributions table
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Contributions are viewable by registry owner and contributor" ON public.contributions;
DROP POLICY IF EXISTS "Authenticated users can create contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can update their own contributions" ON public.contributions;

-- Create new policies
CREATE POLICY "Contributions are viewable by registry owner and contributor"
ON public.contributions FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.gift_items
        JOIN public.registries ON gift_items.registry_id = registries.id
        WHERE gift_items.id = contributions.gift_item_id
        AND registries.user_id = auth.uid()
    )
);

CREATE POLICY "Authenticated users can create contributions"
ON public.contributions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own contributions"
ON public.contributions FOR UPDATE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.contributions TO authenticated; 