-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
    contributor_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contributions_gift_item_id ON contributions(gift_item_id);

-- Add RLS policies
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read contributions
CREATE POLICY "Allow public read access to contributions"
    ON contributions FOR SELECT
    USING (true);

-- Allow anyone to insert contributions
CREATE POLICY "Allow public insert access to contributions"
    ON contributions FOR INSERT
    WITH CHECK (true); 