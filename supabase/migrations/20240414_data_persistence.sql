-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create a function to clean up expired sessions while preserving user data
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions but keep user data
  DELETE FROM auth.sessions
  WHERE expires_at < NOW();
  
  -- Archive old contributions for record keeping
  INSERT INTO contribution_history (
    SELECT 
      c.*,
      NOW() as archived_at
    FROM contributions c
    WHERE c.created_at < NOW() - INTERVAL '1 year'
  );
  
  -- Clean up old contribution history (keep last 5 years)
  DELETE FROM contribution_history
  WHERE archived_at < NOW() - INTERVAL '5 years';
END;
$$ LANGUAGE plpgsql;

-- Create a table for contribution history
CREATE TABLE IF NOT EXISTS contribution_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_item_id UUID REFERENCES gift_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contribution_history_gift_item_id 
ON contribution_history(gift_item_id);
CREATE INDEX IF NOT EXISTS idx_contribution_history_user_id 
ON contribution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_history_created_at 
ON contribution_history(created_at);

-- Schedule cleanup job to run monthly
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 0 1 * *', -- Run at midnight on the first day of each month
  'SELECT cleanup_expired_sessions()'
);

-- Add triggers to maintain data integrity
CREATE OR REPLACE FUNCTION maintain_registry_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure registry owner exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Registry owner must exist';
  END IF;
  
  -- Set default privacy settings if not provided
  IF NEW.privacy_settings IS NULL THEN
    NEW.privacy_settings = jsonb_build_object(
      'is_private', false,
      'show_contributor_names', true,
      'allow_anonymous_contributions', false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_registry_integrity
  BEFORE INSERT OR UPDATE ON registries
  FOR EACH ROW
  EXECUTE FUNCTION maintain_registry_integrity();

-- Add RLS policies for contribution history
ALTER TABLE contribution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contribution history"
  ON contribution_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Registry owners can view contribution history for their registries"
  ON contribution_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_items gi
      JOIN registries r ON r.id = gi.registry_id
      WHERE gi.id = contribution_history.gift_item_id
      AND r.user_id = auth.uid()
    )
  ); 