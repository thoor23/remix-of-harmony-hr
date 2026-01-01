-- Drop the old foreign key constraint that references the custom users table
ALTER TABLE public.super_admins DROP CONSTRAINT super_admins_user_id_fkey;