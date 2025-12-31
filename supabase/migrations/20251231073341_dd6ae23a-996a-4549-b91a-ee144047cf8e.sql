-- Add Internal Billing permission to Admin role
UPDATE public.roles 
SET permissions = permissions || '[{"module": "Internal Billing", "create": true, "read": true, "update": true, "delete": true}]'::jsonb,
    updated_at = now()
WHERE name = 'Admin' AND is_system = true;

-- Add to HR Manager with full permissions
UPDATE public.roles 
SET permissions = permissions || '[{"module": "Internal Billing", "create": true, "read": true, "update": true, "delete": true}]'::jsonb,
    updated_at = now()
WHERE name = 'HR Manager' AND is_system = true;

-- Add to Manager with read-only
UPDATE public.roles 
SET permissions = permissions || '[{"module": "Internal Billing", "create": false, "read": true, "update": false, "delete": false}]'::jsonb,
    updated_at = now()
WHERE name = 'Manager' AND is_system = true;