-- Create contributions table
CREATE TABLE contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
  contributor_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_contributions_gift_item_id ON contributions(gift_item_id);

-- Add total_contributed column to gift_items
ALTER TABLE gift_items
ADD COLUMN total_contributed DECIMAL(10,2) DEFAULT 0;

-- Create function to update total_contributed
CREATE OR REPLACE FUNCTION update_total_contributed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gift_items
  SET total_contributed = (
    SELECT COALESCE(SUM(amount), 0)
    FROM contributions
    WHERE gift_item_id = NEW.gift_item_id
  )
  WHERE id = NEW.gift_item_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating total_contributed
CREATE TRIGGER update_gift_item_total_contributed
  AFTER INSERT OR UPDATE OR DELETE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_total_contributed(); 