-- Add is_purchased column to gift_items table
ALTER TABLE gift_items
ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS gift_items_purchased_idx ON gift_items(is_purchased);

-- Update RLS policies to allow owners to mark items as purchased
CREATE POLICY "Owners can update gift items"
  ON gift_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = gift_items.registry_id
      AND registries.user_id = auth.uid()
    )
  ); 