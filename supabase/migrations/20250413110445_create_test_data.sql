-- Insert a test user record (if it doesn't exist)
-- This is just for testing, in production this would come from auth.users
INSERT INTO public.users (id, email, full_name)
VALUES 
  ('79269ea3-0e48-4eea-ba0e-dd0a08f47e7f', 'salmanali712003@gmail.com', 'Salman Ali')
ON CONFLICT (id) DO NOTHING;

-- Insert test registry
INSERT INTO public.registries (id, user_id, title, description, occasion, event_date, created_at, updated_at, privacy_settings)
VALUES 
  ('e9f8f8f8-f8f8-4f8f-a8f8-f8f8f8f8f8f8', '79269ea3-0e48-4eea-ba0e-dd0a08f47e7f', 'Test Registry', 'Test Registry Description', 'birthday', '2024-12-31', NOW(), NOW(), '{"is_private": false, "show_contributor_names": true, "allow_anonymous_contributions": false}')
ON CONFLICT (id) DO NOTHING;

-- Insert test gift item
INSERT INTO public.gift_items (id, registry_id, user_id, name, description, price, quantity, url, created_at, updated_at)
VALUES 
  ('a9f8f8f8-f8f8-4f8f-b8f8-f8f8f8f8f8f8', 'e9f8f8f8-f8f8-4f8f-a8f8-f8f8f8f8f8f8', '79269ea3-0e48-4eea-ba0e-dd0a08f47e7f', 'Test Gift Item', 'Test Gift Item Description', 100.00, 1, 'https://example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test contribution
INSERT INTO public.contributions (id, gift_item_id, registry_id, user_id, contributor_name, amount, message, created_at)
VALUES 
  ('c9f8f8f8-f8f8-4f8f-c8f8-f8f8f8f8f8f8', 'a9f8f8f8-f8f8-4f8f-b8f8-f8f8f8f8f8f8', 'e9f8f8f8-f8f8-4f8f-a8f8-f8f8f8f8f8f8', '79269ea3-0e48-4eea-ba0e-dd0a08f47e7f', 'Test Contributor', 50.00, 'Test Contribution Message', NOW())
ON CONFLICT (id) DO NOTHING; 