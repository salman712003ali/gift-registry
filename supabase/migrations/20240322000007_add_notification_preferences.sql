-- Add notification preferences to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_notifications": true,
  "contribution_notifications": true,
  "registry_updates": true
}'::jsonb;

-- Create a function to check if user wants to receive notifications
CREATE OR REPLACE FUNCTION should_send_notification(user_id UUID, notification_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (notification_preferences->>notification_type)::BOOLEAN
    FROM users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql; 