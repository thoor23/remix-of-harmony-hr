-- Create profile_change_requests table for employee profile update requests
CREATE TABLE public.profile_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  current_value TEXT,
  new_value TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.employees(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employees can create their own change requests"
ON public.profile_change_requests
FOR INSERT
WITH CHECK (employee_id IN (
  SELECT id FROM employees WHERE user_id = auth.uid()
));

CREATE POLICY "Employees can view their own change requests"
ON public.profile_change_requests
FOR SELECT
USING (employee_id IN (
  SELECT id FROM employees WHERE user_id = auth.uid()
));

CREATE POLICY "Admin and HR can manage all change requests"
ON public.profile_change_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Create ticket_messages table for helpdesk conversations
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.employees(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_messages
CREATE POLICY "Employees can view messages on their tickets"
ON public.ticket_messages
FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM helpdesk_tickets 
    WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  ) AND is_internal = false
);

CREATE POLICY "Employees can send messages on their tickets"
ON public.ticket_messages
FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM helpdesk_tickets 
    WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  ) AND is_internal = false
);

CREATE POLICY "Admin and HR can manage all messages"
ON public.ticket_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Add updated_at trigger for profile_change_requests
CREATE TRIGGER update_profile_change_requests_updated_at
BEFORE UPDATE ON public.profile_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();