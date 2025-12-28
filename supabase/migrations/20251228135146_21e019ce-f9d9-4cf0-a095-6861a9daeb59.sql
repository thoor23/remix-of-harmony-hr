-- Create attendance_regularization_requests table
CREATE TABLE public.attendance_regularization_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  request_date DATE NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'correction', -- 'correction', 'missing_entry', 'overtime'
  original_check_in TIME,
  original_check_out TIME,
  requested_check_in TIME,
  requested_check_out TIME,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES public.employees(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_regularization_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Employees can create their own regularization requests"
ON public.attendance_regularization_requests
FOR INSERT
WITH CHECK (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
));

CREATE POLICY "Employees can view their own regularization requests"
ON public.attendance_regularization_requests
FOR SELECT
USING (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
));

CREATE POLICY "Admin and HR can manage all regularization requests"
ON public.attendance_regularization_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_attendance_regularization_requests_updated_at
BEFORE UPDATE ON public.attendance_regularization_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();