-- Add user_id column to gift_items table
ALTER TABLE public.gift_items
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update existing rows to have a user_id (if any)
-- This is a one-time operation for existing data
UPDATE public.gift_items
SET user_id = (
  SELECT user_id 
  FROM public.registries 
  WHERE registries.id = gift_items.registry_id
)
WHERE user_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gift_items_user_id ON public.gift_items(user_id);

-- Update RLS policies
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view gift items" ON public.gift_items;
DROP POLICY IF EXISTS "Users can create gift items" ON public.gift_items;
DROP POLICY IF EXISTS "Users can update gift items" ON public.gift_items;
DROP POLICY IF EXISTS "Users can delete gift items" ON public.gift_items;

-- Create new policies
CREATE POLICY "Users can view gift items"
ON public.gift_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = gift_items.registry_id
    AND (NOT registries.is_private OR registries.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create gift items"
ON public.gift_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = gift_items.registry_id
    AND registries.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update gift items"
ON public.gift_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = gift_items.registry_id
    AND registries.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete gift items"
ON public.gift_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.registries
    WHERE registries.id = gift_items.registry_id
    AND registries.user_id = auth.uid()
  )
); 