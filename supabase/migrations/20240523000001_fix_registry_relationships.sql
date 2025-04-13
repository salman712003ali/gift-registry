-- Drop existing foreign key constraints if they exist
ALTER TABLE public.registries DROP CONSTRAINT IF EXISTS registries_user_id_fkey;
ALTER TABLE public.registries DROP CONSTRAINT IF EXISTS registries_profile_id_fkey;

-- Add profile_id column to registries table if it doesn't exist
ALTER TABLE public.registries
ADD COLUMN IF NOT EXISTS profile_id UUID;

-- Add foreign key constraint to registries table for profile_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'registries_profile_id_fkey'
  ) THEN
    ALTER TABLE public.registries
    ADD CONSTRAINT registries_profile_id_fkey
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing registries to have profile_id
UPDATE public.registries r
SET profile_id = p.id
FROM public.profiles p
WHERE r.user_id = p.id
AND r.profile_id IS NULL;

-- Add registry_id column to contributions table if it doesn't exist
ALTER TABLE public.contributions
ADD COLUMN IF NOT EXISTS registry_id UUID;

-- Update existing contributions to have registry_id
UPDATE public.contributions c
SET registry_id = g.registry_id
FROM public.gift_items g
WHERE c.gift_item_id = g.id
AND c.registry_id IS NULL;

-- Add foreign key constraint for registry_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contributions_registry_id_fkey'
  ) THEN
    ALTER TABLE public.contributions
    ADD CONSTRAINT contributions_registry_id_fkey
    FOREIGN KEY (registry_id)
    REFERENCES public.registries(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing foreign key constraints for contributions if they exist
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_user_id_fkey;
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_profile_id_fkey;

-- Add foreign key constraint to contributions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contributions_user_id_fkey'
  ) THEN
    ALTER TABLE public.contributions
    ADD CONSTRAINT contributions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add profile_id column to contributions table if it doesn't exist
ALTER TABLE public.contributions
ADD COLUMN IF NOT EXISTS profile_id UUID;

-- Add foreign key constraint to contributions table for profile_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contributions_profile_id_fkey'
  ) THEN
    ALTER TABLE public.contributions
    ADD CONSTRAINT contributions_profile_id_fkey
    FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Update existing contributions to have profile_id
UPDATE public.contributions c
SET profile_id = p.id
FROM public.profiles p
WHERE c.user_id = p.id
AND c.profile_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON public.registries(user_id);
CREATE INDEX IF NOT EXISTS idx_registries_profile_id ON public.registries(profile_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON public.contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_profile_id ON public.contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON public.contributions(registry_id);

-- Update RLS policies for registries
ALTER TABLE public.registries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view registries" ON public.registries;
DROP POLICY IF EXISTS "Users can create registries" ON public.registries;
DROP POLICY IF EXISTS "Users can update registries" ON public.registries;
DROP POLICY IF EXISTS "Users can delete registries" ON public.registries;

-- Create new policies for registries
CREATE POLICY "Users can view registries"
ON public.registries FOR SELECT
USING (NOT is_private OR user_id = auth.uid());

CREATE POLICY "Users can create registries"
ON public.registries FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update registries"
ON public.registries FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete registries"
ON public.registries FOR DELETE
USING (user_id = auth.uid());

-- Update RLS policies for contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can create contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can update contributions" ON public.contributions;
DROP POLICY IF EXISTS "Users can delete contributions" ON public.contributions;

-- Create new policies for contributions
CREATE POLICY "Users can view contributions"
ON public.contributions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = contributions.registry_id
    AND (NOT registries.is_private OR registries.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create contributions"
ON public.contributions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = contributions.registry_id
    AND (NOT registries.is_private OR registries.user_id = auth.uid())
  )
);

CREATE POLICY "Users can update contributions"
ON public.contributions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = contributions.registry_id
    AND (NOT registries.is_private OR registries.user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete contributions"
ON public.contributions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = contributions.registry_id
    AND (NOT registries.is_private OR registries.user_id = auth.uid())
  )
); 