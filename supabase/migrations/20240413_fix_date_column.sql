-- Check if date column exists and rename it to event_date
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'registries'
        AND column_name = 'date'
    ) THEN
        ALTER TABLE registries RENAME COLUMN date TO event_date;
    END IF;
END $$;

-- Add event_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'registries'
        AND column_name = 'event_date'
    ) THEN
        ALTER TABLE registries ADD COLUMN event_date DATE;
    END IF;
END $$; 