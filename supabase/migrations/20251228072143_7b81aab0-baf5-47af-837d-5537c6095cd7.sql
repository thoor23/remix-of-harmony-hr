-- Create targeted_notifications table
CREATE TABLE public.targeted_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  priority text NOT NULL DEFAULT 'medium',
  target_type text NOT NULL DEFAULT 'all',
  target_ids jsonb DEFAULT '[]'::jsonb,
  sent_by uuid NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.targeted_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for targeted_notifications
CREATE POLICY "Admin and HR can manage targeted notifications"
ON public.targeted_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Create function to get employee user_ids by department IDs
CREATE OR REPLACE FUNCTION public.get_department_employee_user_ids(department_ids uuid[])
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.user_id
  FROM public.employees e
  WHERE e.department_id = ANY(department_ids)
    AND e.user_id IS NOT NULL
    AND e.status = 'active'
$$;

-- Create function to get employee user_ids by employee IDs
CREATE OR REPLACE FUNCTION public.get_employee_user_ids(employee_ids uuid[])
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.user_id
  FROM public.employees e
  WHERE e.id = ANY(employee_ids)
    AND e.user_id IS NOT NULL
$$;