-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_amount NUMERIC DEFAULT 0,
  requires_receipt BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_claims table
CREATE TABLE public.expense_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.employees(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,
  reimbursed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_policies table
CREATE TABLE public.expense_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_monthly_limit NUMERIC DEFAULT 0,
  requires_manager_approval BOOLEAN DEFAULT true,
  auto_approve_below NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Admin and HR can manage expense categories"
ON public.expense_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active categories"
ON public.expense_categories
FOR SELECT
USING (is_active = true);

-- RLS Policies for expense_claims
CREATE POLICY "Admin and HR can manage all expense claims"
ON public.expense_claims
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can create their own expense claims"
ON public.expense_claims
FOR INSERT
WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view their own expense claims"
ON public.expense_claims
FOR SELECT
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update their own pending claims"
ON public.expense_claims
FOR UPDATE
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) AND status = 'pending');

CREATE POLICY "Employees can delete their own pending claims"
ON public.expense_claims
FOR DELETE
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) AND status = 'pending');

-- RLS Policies for expense_policies
CREATE POLICY "Admin can manage expense policies"
ON public.expense_policies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active policies"
ON public.expense_policies
FOR SELECT
USING (is_active = true);

-- Create triggers for updated_at
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_claims_updated_at
BEFORE UPDATE ON public.expense_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_policies_updated_at
BEFORE UPDATE ON public.expense_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default expense categories
INSERT INTO public.expense_categories (name, code, description, max_amount, requires_receipt) VALUES
('Travel', 'TRV', 'Travel and transportation expenses', 50000, true),
('Food & Meals', 'FD', 'Food and meal expenses during work', 5000, true),
('Equipment', 'EQP', 'Office equipment and supplies', 25000, true),
('Communication', 'COM', 'Phone and internet expenses', 3000, true),
('Accommodation', 'ACC', 'Hotel and lodging expenses', 10000, true),
('Miscellaneous', 'MISC', 'Other work-related expenses', 5000, false);

-- Insert default expense policy
INSERT INTO public.expense_policies (name, max_monthly_limit, requires_manager_approval, auto_approve_below) VALUES
('Default Policy', 100000, true, 500);