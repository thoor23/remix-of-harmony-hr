-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id UUID REFERENCES auth.users(id),
  employee_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Designations table
CREATE TABLE public.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  level INTEGER DEFAULT 1,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Employees table (extends profiles with HR-specific data)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  employee_id TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  designation_id UUID REFERENCES public.designations(id),
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  date_of_birth DATE,
  employment_type TEXT NOT NULL DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave', 'terminated')),
  reporting_to UUID REFERENCES public.employees(id),
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_country TEXT,
  address_zip_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_account_holder_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leave types table
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  max_days INTEGER NOT NULL DEFAULT 12,
  carry_forward BOOLEAN DEFAULT false,
  encashable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4,1) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.employees(id),
  approved_on TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendance records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day', 'on-leave', 'weekend', 'holiday')),
  work_hours NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 60,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'event', 'policy-update', 'holiday')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  target_audience TEXT NOT NULL DEFAULT 'all',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments (viewable by all authenticated, manageable by admin)
CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments"
ON public.departments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for designations
CREATE POLICY "Authenticated users can view designations"
ON public.designations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage designations"
ON public.designations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for employees
CREATE POLICY "Users can view their own employee record"
ON public.employees FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin and HR can view all employees"
ON public.employees FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

CREATE POLICY "Admin and HR can manage employees"
ON public.employees FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

-- RLS Policies for leave_types
CREATE POLICY "Authenticated users can view leave types"
ON public.leave_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage leave types"
ON public.leave_types FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
ON public.leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "Admin and HR can view all leave requests"
ON public.leave_requests FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

CREATE POLICY "Admin and HR can manage leave requests"
ON public.leave_requests FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

-- RLS Policies for attendance_records
CREATE POLICY "Users can view their own attendance"
ON public.attendance_records FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "Admin and HR can view all attendance"
ON public.attendance_records FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

CREATE POLICY "Admin and HR can manage attendance"
ON public.attendance_records FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

-- RLS Policies for shifts
CREATE POLICY "Authenticated users can view shifts"
ON public.shifts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage shifts"
ON public.shifts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for announcements
CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admin and HR can manage announcements"
ON public.announcements FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')
);

-- Create updated_at triggers
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON public.designations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();