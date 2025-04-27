-- Add product-related fields to gift_items table
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS retailer text,
ADD COLUMN IF NOT EXISTS product_url text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS rating numeric,
ADD COLUMN IF NOT EXISTS reviews_count integer,
ADD COLUMN IF NOT EXISTS availability text,
ADD COLUMN IF NOT EXISTS shipping_info text;

-- Create an index for faster product searches
CREATE INDEX IF NOT EXISTS idx_gift_items_product_search
ON gift_items (name, retailer, brand, category);

-- Update RLS policies to allow reading product data
CREATE POLICY "Anyone can view product data"
ON gift_items
FOR SELECT
USING (true);

-- Create a function to search products by name, brand, or category
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