-- Create shift_exchange_requests table for shift swap functionality
CREATE TABLE public.shift_exchange_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  target_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  requester_shift_id UUID NOT NULL REFERENCES public.shifts(id),
  target_shift_id UUID NOT NULL REFERENCES public.shifts(id),
  request_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  response_note TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shift_exchange_requests ENABLE ROW LEVEL SECURITY;

-- Policies for shift exchange requests
CREATE POLICY "Admin and HR can manage all shift exchanges" 
ON public.shift_exchange_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view their own requests" 
ON public.shift_exchange_requests 
FOR SELECT 
USING (
  requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
  target_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

CREATE POLICY "Employees can create their own requests" 
ON public.shift_exchange_requests 
FOR INSERT 
WITH CHECK (requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can update requests they are involved in" 
ON public.shift_exchange_requests 
FOR UPDATE 
USING (
  requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
  target_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_shift_exchange_requests_updated_at
BEFORE UPDATE ON public.shift_exchange_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();