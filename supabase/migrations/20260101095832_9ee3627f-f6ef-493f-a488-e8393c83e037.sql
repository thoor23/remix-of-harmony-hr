-- Drop foreign key constraints first
ALTER TABLE IF EXISTS super_admins DROP CONSTRAINT IF EXISTS super_admins_user_id_fkey;

-- Drop old authentication tables (replaced by Supabase Auth)
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

-- Drop empty/unused tables
DROP TABLE IF EXISTS status_subscribers;
DROP TABLE IF EXISTS status_subscriptions;
DROP TABLE IF EXISTS platform_announcements;