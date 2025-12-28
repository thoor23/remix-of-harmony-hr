-- Add profile columns to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Migrate data from profiles to employees
UPDATE public.employees e
SET 
  first_name = p.first_name,
  last_name = p.last_name,
  email = p.email,
  phone = p.phone,
  avatar_url = p.avatar_url
FROM public.profiles p
WHERE e.user_id = p.user_id;

-- Create index on email for lookup efficiency
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);