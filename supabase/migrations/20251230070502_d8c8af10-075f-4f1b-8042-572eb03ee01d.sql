-- Create shift_rotations table for shift rotation patterns
CREATE TABLE public.shift_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rotation_pattern UUID[] NOT NULL DEFAULT '{}',
  rotation_frequency TEXT NOT NULL DEFAULT 'weekly',
  employee_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create roles table for custom role definitions with permissions
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  user_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.shift_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for shift_rotations
CREATE POLICY "Admin and HR can manage shift rotations"
ON public.shift_rotations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view shift rotations"
ON public.shift_rotations
FOR SELECT
USING (is_active = true);

-- RLS policies for roles
CREATE POLICY "Admin can manage roles"
ON public.roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view roles"
ON public.roles
FOR SELECT
USING (true);

-- Trigger for updated_at on shift_rotations
CREATE TRIGGER update_shift_rotations_updated_at
BEFORE UPDATE ON public.shift_rotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on roles
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles
INSERT INTO public.roles (name, description, permissions, is_system) VALUES
('Admin', 'Full system access with all permissions', '[{"module": "Dashboard", "create": true, "read": true, "update": true, "delete": true}, {"module": "Employees", "create": true, "read": true, "update": true, "delete": true}, {"module": "Attendance", "create": true, "read": true, "update": true, "delete": true}, {"module": "Leaves", "create": true, "read": true, "update": true, "delete": true}, {"module": "Payroll", "create": true, "read": true, "update": true, "delete": true}, {"module": "Shifts", "create": true, "read": true, "update": true, "delete": true}, {"module": "Reports", "create": true, "read": true, "update": true, "delete": true}, {"module": "Settings", "create": true, "read": true, "update": true, "delete": true}]', true),
('HR Manager', 'Human resources management access', '[{"module": "Dashboard", "create": false, "read": true, "update": false, "delete": false}, {"module": "Employees", "create": true, "read": true, "update": true, "delete": false}, {"module": "Attendance", "create": true, "read": true, "update": true, "delete": false}, {"module": "Leaves", "create": true, "read": true, "update": true, "delete": false}, {"module": "Payroll", "create": true, "read": true, "update": true, "delete": false}, {"module": "Shifts", "create": true, "read": true, "update": true, "delete": false}, {"module": "Reports", "create": false, "read": true, "update": false, "delete": false}, {"module": "Settings", "create": false, "read": true, "update": false, "delete": false}]', true),
('Store Manager', 'Store-level management access', '[{"module": "Dashboard", "create": false, "read": true, "update": false, "delete": false}, {"module": "Employees", "create": false, "read": true, "update": false, "delete": false}, {"module": "Attendance", "create": true, "read": true, "update": true, "delete": false}, {"module": "Leaves", "create": false, "read": true, "update": true, "delete": false}, {"module": "Payroll", "create": false, "read": false, "update": false, "delete": false}, {"module": "Shifts", "create": true, "read": true, "update": true, "delete": false}, {"module": "Reports", "create": false, "read": true, "update": false, "delete": false}, {"module": "Settings", "create": false, "read": false, "update": false, "delete": false}]', true),
('Employee', 'Basic employee access', '[{"module": "Dashboard", "create": false, "read": true, "update": false, "delete": false}, {"module": "Employees", "create": false, "read": false, "update": false, "delete": false}, {"module": "Attendance", "create": true, "read": true, "update": false, "delete": false}, {"module": "Leaves", "create": true, "read": true, "update": false, "delete": false}, {"module": "Payroll", "create": false, "read": true, "update": false, "delete": false}, {"module": "Shifts", "create": false, "read": true, "update": false, "delete": false}, {"module": "Reports", "create": false, "read": false, "update": false, "delete": false}, {"module": "Settings", "create": false, "read": false, "update": false, "delete": false}]', true);