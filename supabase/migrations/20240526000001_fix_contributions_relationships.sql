-- Fix contributions table relationships
DO $$
BEGIN
  -- Ensure registry_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contributions' 
    AND column_name = 'registry_id'
  ) THEN
    ALTER TABLE public.contributions 
    ADD COLUMN registry_id UUID REFERENCES public.registries(id) ON DELETE CASCADE;
    
    -- Set registry_id based on gift_items if it's NULL
    UPDATE public.contributions c
    SET registry_id = g.registry_id
    FROM public.gift_items g
    WHERE c.gift_item_id = g.id
    AND c.registry_id IS NULL;
  END IF;
  
  -- Drop existing foreign key constraint on user_id if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contributions_user_id_fkey'
  ) THEN
    ALTER TABLE public.contributions 
    DROP CONSTRAINT contributions_user_id_fkey;
  END IF;
  
  -- Add foreign key constraint to auth.users
  ALTER TABLE public.contributions
  ADD CONSTRAINT contributions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
  
  -- Add profile_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contributions' 
    AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE public.contributions 
    ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Ensure contributor_name column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contributions' 
    AND column_name = 'contributor_name'
  ) THEN
    ALTER TABLE public.contributions 
    ADD COLUMN contributor_name TEXT;
  END IF;
  
  -- Update profile_id from user_id if profile_id is NULL
  UPDATE public.contributions c
  SET profile_id = user_id
  WHERE profile_id IS NULL AND user_id IS NOT NULL;
  
  -- Create/update indexes
  CREATE INDEX IF NOT EXISTS idx_contributions_registry_id 
  ON public.contributions(registry_id);
  
  CREATE INDEX IF NOT EXISTS idx_contributions_user_id 
  ON public.contributions(user_id);
  
  CREATE INDEX IF NOT EXISTS idx_contributions_profile_id 
  ON public.contributions(profile_id);
END $$; 