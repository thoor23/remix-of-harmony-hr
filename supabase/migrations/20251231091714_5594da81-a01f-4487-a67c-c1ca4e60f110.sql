-- Onboarding Templates Table
CREATE TABLE public.onboarding_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id),
  designation_id UUID REFERENCES public.designations(id),
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Onboarding Processes Table
CREATE TABLE public.onboarding_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.onboarding_templates(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date DATE,
  completed_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Onboarding Tasks Table
CREATE TABLE public.onboarding_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id UUID NOT NULL REFERENCES public.onboarding_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'day_one' CHECK (category IN ('pre_joining', 'day_one', 'week_one', 'month_one')),
  assigned_to UUID REFERENCES public.employees(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.employees(id),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offboarding Processes Table
CREATE TABLE public.offboarding_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  exit_type TEXT NOT NULL DEFAULT 'resignation' CHECK (exit_type IN ('resignation', 'termination', 'retirement', 'layoff', 'contract_end', 'absconding')),
  resignation_date DATE,
  last_working_day DATE NOT NULL,
  notice_period_days INTEGER DEFAULT 30,
  exit_reason TEXT,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'clearance_pending', 'fnf_pending', 'completed', 'cancelled')),
  handover_to UUID REFERENCES public.employees(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offboarding Tasks Table
CREATE TABLE public.offboarding_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offboarding_id UUID NOT NULL REFERENCES public.offboarding_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'documentation' CHECK (category IN ('knowledge_transfer', 'asset_return', 'access_revocation', 'documentation', 'clearance')),
  assigned_to UUID REFERENCES public.employees(id),
  department_id UUID REFERENCES public.departments(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_applicable')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.employees(id),
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exit Interviews Table
CREATE TABLE public.exit_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offboarding_id UUID NOT NULL REFERENCES public.offboarding_processes(id) ON DELETE CASCADE,
  conducted_by UUID REFERENCES public.employees(id),
  interview_date DATE,
  reason_for_leaving TEXT,
  feedback JSONB DEFAULT '{}'::jsonb,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  would_rejoin BOOLEAN,
  would_recommend BOOLEAN,
  suggestions TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FnF Settlements Table
CREATE TABLE public.fnf_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offboarding_id UUID NOT NULL REFERENCES public.offboarding_processes(id) ON DELETE CASCADE,
  pending_salary_days INTEGER DEFAULT 0,
  pending_salary_amount NUMERIC(12,2) DEFAULT 0,
  leave_encashment_days INTEGER DEFAULT 0,
  leave_encashment_amount NUMERIC(12,2) DEFAULT 0,
  bonus_amount NUMERIC(12,2) DEFAULT 0,
  gratuity_amount NUMERIC(12,2) DEFAULT 0,
  other_earnings NUMERIC(12,2) DEFAULT 0,
  other_earnings_notes TEXT,
  advance_deduction NUMERIC(12,2) DEFAULT 0,
  loan_deduction NUMERIC(12,2) DEFAULT 0,
  notice_period_deduction NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  other_deductions_notes TEXT,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  final_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'approved', 'processed', 'paid')),
  processed_by UUID REFERENCES public.employees(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fnf_settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_templates
CREATE POLICY "Admin and HR can manage onboarding templates"
ON public.onboarding_templates FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Authenticated users can view active templates"
ON public.onboarding_templates FOR SELECT
USING (is_active = true);

-- RLS Policies for onboarding_processes
CREATE POLICY "Admin and HR can manage all onboarding processes"
ON public.onboarding_processes FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can view their own onboarding"
ON public.onboarding_processes FOR SELECT
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- RLS Policies for onboarding_tasks
CREATE POLICY "Admin and HR can manage all onboarding tasks"
ON public.onboarding_tasks FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Assigned users can update their tasks"
ON public.onboarding_tasks FOR UPDATE
USING (assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view tasks for their onboarding"
ON public.onboarding_tasks FOR SELECT
USING (onboarding_id IN (
  SELECT id FROM onboarding_processes WHERE employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
));

-- RLS Policies for offboarding_processes
CREATE POLICY "Admin and HR can manage all offboarding processes"
ON public.offboarding_processes FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can view their own offboarding"
ON public.offboarding_processes FOR SELECT
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- RLS Policies for offboarding_tasks
CREATE POLICY "Admin and HR can manage all offboarding tasks"
ON public.offboarding_tasks FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Assigned users can update offboarding tasks"
ON public.offboarding_tasks FOR UPDATE
USING (assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view their offboarding tasks"
ON public.offboarding_tasks FOR SELECT
USING (offboarding_id IN (
  SELECT id FROM offboarding_processes WHERE employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
));

-- RLS Policies for exit_interviews
CREATE POLICY "Admin and HR can manage all exit interviews"
ON public.exit_interviews FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can view their own exit interview"
ON public.exit_interviews FOR SELECT
USING (offboarding_id IN (
  SELECT id FROM offboarding_processes WHERE employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
));

-- RLS Policies for fnf_settlements
CREATE POLICY "Admin and HR can manage all FnF settlements"
ON public.fnf_settlements FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can view their own FnF settlement"
ON public.fnf_settlements FOR SELECT
USING (offboarding_id IN (
  SELECT id FROM offboarding_processes WHERE employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
));

-- Create updated_at triggers
CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_processes_updated_at
  BEFORE UPDATE ON public.onboarding_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_tasks_updated_at
  BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offboarding_processes_updated_at
  BEFORE UPDATE ON public.offboarding_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offboarding_tasks_updated_at
  BEFORE UPDATE ON public.offboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exit_interviews_updated_at
  BEFORE UPDATE ON public.exit_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fnf_settlements_updated_at
  BEFORE UPDATE ON public.fnf_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default onboarding template
INSERT INTO public.onboarding_templates (name, description, is_default, tasks) VALUES
('Standard Onboarding', 'Default onboarding checklist for all new employees', true, '[
  {"title": "Collect ID proof and address proof", "category": "pre_joining", "order": 1},
  {"title": "Verify educational certificates", "category": "pre_joining", "order": 2},
  {"title": "Complete background verification", "category": "pre_joining", "order": 3},
  {"title": "Send offer letter", "category": "pre_joining", "order": 4},
  {"title": "Create employee ID and email", "category": "day_one", "order": 1},
  {"title": "Issue laptop/desktop", "category": "day_one", "order": 2},
  {"title": "Provide access cards", "category": "day_one", "order": 3},
  {"title": "HR orientation session", "category": "day_one", "order": 4},
  {"title": "Team introduction", "category": "day_one", "order": 5},
  {"title": "Assign buddy/mentor", "category": "week_one", "order": 1},
  {"title": "Complete compliance training", "category": "week_one", "order": 2},
  {"title": "Setup tools and software", "category": "week_one", "order": 3},
  {"title": "Review company policies", "category": "week_one", "order": 4},
  {"title": "Complete department training", "category": "month_one", "order": 1},
  {"title": "Set initial goals and KPIs", "category": "month_one", "order": 2},
  {"title": "First performance check-in", "category": "month_one", "order": 3}
]'::jsonb);