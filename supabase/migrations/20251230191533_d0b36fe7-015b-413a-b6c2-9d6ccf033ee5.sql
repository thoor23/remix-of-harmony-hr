-- Add role_id column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT r.permissions
     FROM public.roles r
     INNER JOIN public.user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = _user_id
     LIMIT 1),
    '[]'::jsonb
  )
$$;

-- Create function to get user role info
CREATE OR REPLACE FUNCTION public.get_user_role_info(_user_id uuid)
RETURNS TABLE(role_id uuid, role_name text, permissions jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.name, r.permissions
  FROM public.roles r
  INNER JOIN public.user_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = _user_id
  LIMIT 1
$$;

-- Create function to check module permission
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_perms jsonb;
  module_perm jsonb;
BEGIN
  -- Get user permissions
  SELECT get_user_permissions(_user_id) INTO user_perms;
  
  -- Find the module permission
  SELECT elem INTO module_perm
  FROM jsonb_array_elements(user_perms) AS elem
  WHERE elem->>'module' = _module
  LIMIT 1;
  
  -- Check if action is allowed
  IF module_perm IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN COALESCE((module_perm->>_action)::boolean, FALSE);
END;
$$;