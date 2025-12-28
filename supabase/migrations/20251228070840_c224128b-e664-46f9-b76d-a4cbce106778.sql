-- Create a security definer function to get admin and HR user IDs
-- This allows any authenticated user to get admin/HR user_ids for notifications
CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'hr')
$$;