-- Add role_type column to roles table
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'admin' CHECK (role_type IN ('admin', 'employee'));