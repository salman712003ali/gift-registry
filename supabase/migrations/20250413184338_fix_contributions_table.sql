-- Add contributor_email column to contributions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'contributor_email'
    ) THEN
        ALTER TABLE "contributions" ADD COLUMN "contributor_email" TEXT;
    END IF;
END
$$;

-- Add index on contributor_email for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'contributions'
        AND indexname = 'contributions_contributor_email_idx'
    ) THEN
        CREATE INDEX "contributions_contributor_email_idx" ON "contributions" ("contributor_email");
    END IF;
END
$$;

-- Update permissions to allow access to the contributor_email column
ALTER TABLE "contributions" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to contributions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'contributions'
        AND policyname = 'contributions_select_policy'
    ) THEN
        CREATE POLICY "contributions_select_policy" ON "contributions" 
            FOR SELECT 
            USING (true);
    END IF;
END
$$;

-- Allow authenticated users to create contributions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'contributions'
        AND policyname = 'contributions_insert_policy'
    ) THEN
        CREATE POLICY "contributions_insert_policy" ON "contributions" 
            FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
    END IF;
END
$$;

-- Allow public to create contributions (for anonymous contributors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'contributions'
        AND policyname = 'contributions_insert_anon_policy'
    ) THEN
        CREATE POLICY "contributions_insert_anon_policy" ON "contributions" 
            FOR INSERT 
            TO anon
            WITH CHECK (true);
    END IF;
END
$$;
