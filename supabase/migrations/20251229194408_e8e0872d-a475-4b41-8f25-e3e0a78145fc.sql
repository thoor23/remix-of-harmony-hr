-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip_code TEXT,
  address_country TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  opening_time TIME,
  closing_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Stores RLS policies
CREATE POLICY "Admin and HR can manage stores"
ON public.stores FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Store managers can view their stores"
ON public.stores FOR SELECT
USING (
  has_role(auth.uid(), 'store_manager') AND
  manager_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can view active stores"
ON public.stores FOR SELECT
USING (is_active = true);

-- Create employee_store_assignments table
CREATE TABLE public.employee_store_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, store_id)
);

-- Enable RLS on employee_store_assignments
ALTER TABLE public.employee_store_assignments ENABLE ROW LEVEL SECURITY;

-- Employee store assignments RLS policies
CREATE POLICY "Admin and HR can manage store assignments"
ON public.employee_store_assignments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Store managers can view their store assignments"
ON public.employee_store_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'store_manager') AND
  store_id IN (SELECT id FROM stores WHERE manager_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
);

CREATE POLICY "Employees can view their own store assignments"
ON public.employee_store_assignments FOR SELECT
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Add store_id to attendance_records
ALTER TABLE public.attendance_records 
ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Add store_id to shift_assignments
ALTER TABLE public.shift_assignments 
ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Add store_id to leave_requests
ALTER TABLE public.leave_requests 
ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Add primary_store_id to employees
ALTER TABLE public.employees 
ADD COLUMN primary_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- Create trigger for stores updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for employee_store_assignments updated_at
CREATE TRIGGER update_employee_store_assignments_updated_at
BEFORE UPDATE ON public.employee_store_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();