-- Insert sample data into the database

-- Insert sample users (passwords would be hashed in a real application)
INSERT INTO public.users (id, email, encrypted_password, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'password_hash_would_go_here', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'user1@example.com', 'password_hash_would_go_here', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'user2@example.com', 'password_hash_would_go_here', now(), now())
ON CONFLICT (email) DO NOTHING;

-- Insert sample profiles
INSERT INTO public.profiles (id, username, full_name, avatar_url, website, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin User', 'https://example.com/avatars/admin.png', 'https://admin.example.com', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'user1', 'First User', 'https://example.com/avatars/user1.png', 'https://user1.example.com', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'user2', 'Second User', 'https://example.com/avatars/user2.png', 'https://user2.example.com', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES 
  ('avatars', 'User Avatars', true, now(), now()),
  ('documents', 'User Documents', false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample objects
INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_at, updated_at)
VALUES 
  ('avatars', 'admin.png', '00000000-0000-0000-0000-000000000001', '{"size": 24500, "mimetype": "image/png"}', now(), now()),
  ('avatars', 'user1.png', '00000000-0000-0000-0000-000000000002', '{"size": 18200, "mimetype": "image/png"}', now(), now()),
  ('avatars', 'user2.png', '00000000-0000-0000-0000-000000000003', '{"size": 21300, "mimetype": "image/png"}', now(), now()),
  ('documents', 'admin/report.pdf', '00000000-0000-0000-0000-000000000001', '{"size": 152400, "mimetype": "application/pdf"}', now(), now()),
  ('documents', 'user1/notes.txt', '00000000-0000-0000-0000-000000000002', '{"size": 2800, "mimetype": "text/plain"}', now(), now())
ON CONFLICT DO NOTHING;
