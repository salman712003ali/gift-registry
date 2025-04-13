-- Add is_purchased column to gift_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'gift_items'
        AND column_name = 'is_purchased'
    ) THEN
        ALTER TABLE public.gift_items 
        ADD COLUMN is_purchased BOOLEAN DEFAULT false;
        
        CREATE INDEX IF NOT EXISTS idx_gift_items_is_purchased ON public.gift_items(is_purchased);
        
        -- Create or replace RLS policy to allow marking items as purchased
        DROP POLICY IF EXISTS "Registry owners can mark items as purchased" ON public.gift_items;
        CREATE POLICY "Registry owners can mark items as purchased" 
        ON public.gift_items
        FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM registries
                WHERE registries.id = gift_items.registry_id
                AND registries.user_id = auth.uid()
            )
        );
    END IF;
END $$; 