-- Create Manager system role if it doesn't exist
INSERT INTO public.roles (name, description, is_system, role_type, permissions)
SELECT 
  'Manager',
  'Team manager with oversight capabilities',
  true,
  'admin',
  jsonb_build_array(
    jsonb_build_object('module', 'Dashboard', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Employees', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Departments', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Designations', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Attendance', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Leaves', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Payroll', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Expenses', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Shifts', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Documents', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Assets', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Helpdesk', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Announcements', 'create', true, 'read', true, 'update', true, 'delete', false),
    jsonb_build_object('module', 'Reports', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Holidays', 'create', false, 'read', true, 'update', false, 'delete', false),
    jsonb_build_object('module', 'Locations', 'create', false, 'read', true, 'update', false, 'delete', false)
  )
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'Manager' AND is_system = true);

-- Map legacy 'admin' role users to Admin system role
UPDATE public.user_roles
SET role_id = (SELECT id FROM public.roles WHERE name = 'Admin' AND is_system = true LIMIT 1)
WHERE role = 'admin' AND role_id IS NULL;

-- Map legacy 'hr' role users to HR Manager system role
UPDATE public.user_roles
SET role_id = (SELECT id FROM public.roles WHERE name = 'HR Manager' AND is_system = true LIMIT 1)
WHERE role = 'hr' AND role_id IS NULL;

-- Map legacy 'store_manager' role users to Store Manager system role
UPDATE public.user_roles
SET role_id = (SELECT id FROM public.roles WHERE name = 'Store Manager' AND is_system = true LIMIT 1)
WHERE role = 'store_manager' AND role_id IS NULL;

-- Map legacy 'manager' role users to Manager system role
UPDATE public.user_roles
SET role_id = (SELECT id FROM public.roles WHERE name = 'Manager' AND is_system = true LIMIT 1)
WHERE role = 'manager' AND role_id IS NULL;

-- Map legacy 'employee' role users to Employee system role
UPDATE public.user_roles
SET role_id = (SELECT id FROM public.roles WHERE name = 'Employee' AND is_system = true LIMIT 1)
WHERE role = 'employee' AND role_id IS NULL;

-- Update user_count for all roles
UPDATE public.roles r
SET user_count = (
  SELECT COUNT(*) FROM public.user_roles ur WHERE ur.role_id = r.id
);