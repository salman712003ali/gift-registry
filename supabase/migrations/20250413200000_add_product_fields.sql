-- Add product-related fields to gift_items table if they don't exist
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'retailer') THEN
        ALTER TABLE gift_items ADD COLUMN retailer text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'product_url') THEN
        ALTER TABLE gift_items ADD COLUMN product_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'brand') THEN
        ALTER TABLE gift_items ADD COLUMN brand text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'category') THEN
        ALTER TABLE gift_items ADD COLUMN category text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'rating') THEN
        ALTER TABLE gift_items ADD COLUMN rating numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'reviews_count') THEN
        ALTER TABLE gift_items ADD COLUMN reviews_count integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'availability') THEN
        ALTER TABLE gift_items ADD COLUMN availability text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_items' AND column_name = 'shipping_info') THEN
        ALTER TABLE gift_items ADD COLUMN shipping_info text;
    END IF;
END $$;

-- Create an index for faster product searches if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_gift_items_product_search') THEN
        CREATE INDEX idx_gift_items_product_search ON gift_items (name, retailer, brand, category);
    END IF;
END $$;

-- Create or replace the search function
CREATE OR REPLACE FUNCTION search_products(search_query text)
RETURNS SETOF gift_items
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT ON (id) *
  FROM gift_items
  WHERE 
    name ILIKE '%' || search_query || '%'
    OR brand ILIKE '%' || search_query || '%'
    OR category ILIKE '%' || search_query || '%'
  ORDER BY id, rating DESC NULLS LAST, price ASC
  LIMIT 30;
$$; 