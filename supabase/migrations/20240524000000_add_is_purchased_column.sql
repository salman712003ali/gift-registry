-- Add is_purchased column to gift_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gift_items'
        AND column_name = 'is_purchased'
    ) THEN
        ALTER TABLE public.gift_items ADD COLUMN is_purchased BOOLEAN DEFAULT false;
    END IF;
END
$$; 