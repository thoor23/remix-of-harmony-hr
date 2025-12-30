-- Create asset_maintenance_requests table
CREATE TABLE public.asset_maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'repair',
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.employees(id),
  reviewed_at timestamp with time zone,
  review_comments text,
  assigned_to text,
  scheduled_date date,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  resolution_notes text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Employees can create requests for their assigned assets
CREATE POLICY "Employees can create maintenance requests"
  ON public.asset_maintenance_requests FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- Employees can view their own requests
CREATE POLICY "Employees can view own requests"
  ON public.asset_maintenance_requests FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- Employees can update (cancel) their own pending requests
CREATE POLICY "Employees can cancel own pending requests"
  ON public.asset_maintenance_requests FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    AND status = 'pending'
  );

-- Admin and HR can manage all requests
CREATE POLICY "Admin and HR can manage all requests"
  ON public.asset_maintenance_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_asset_maintenance_requests_updated_at
  BEFORE UPDATE ON public.asset_maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();