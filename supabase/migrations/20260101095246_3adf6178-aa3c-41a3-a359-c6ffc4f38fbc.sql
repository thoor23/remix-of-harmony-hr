-- Add new foreign key to reference auth.users
ALTER TABLE public.super_admins 
ADD CONSTRAINT super_admins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;