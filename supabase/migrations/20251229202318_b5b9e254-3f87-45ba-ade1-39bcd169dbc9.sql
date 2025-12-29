-- Create employee transfer history table
CREATE TABLE public.employee_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  from_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  to_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_date DATE NOT NULL,
  reason TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  initiated_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin and HR can manage all transfers"
ON public.employee_transfers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view their own transfers"
ON public.employee_transfers
FOR SELECT
USING (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
));

CREATE POLICY "Store managers can view transfers for their stores"
ON public.employee_transfers
FOR SELECT
USING (
  has_role(auth.uid(), 'store_manager'::app_role) AND (
    from_store_id IN (
      SELECT id FROM public.stores WHERE manager_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    ) OR
    to_store_id IN (
      SELECT id FROM public.stores WHERE manager_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_employee_transfers_updated_at
  BEFORE UPDATE ON public.employee_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_employee_transfers_employee_id ON public.employee_transfers(employee_id);
CREATE INDEX idx_employee_transfers_to_store_id ON public.employee_transfers(to_store_id);
CREATE INDEX idx_employee_transfers_effective_date ON public.employee_transfers(effective_date);