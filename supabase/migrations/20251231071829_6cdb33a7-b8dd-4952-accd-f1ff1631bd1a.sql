-- Create internal invoice categories table
CREATE TABLE public.internal_invoice_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create internal invoices table
CREATE TABLE public.internal_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  from_location_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  to_location_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  invoice_type TEXT NOT NULL DEFAULT 'internal_service',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  next_recurring_date DATE,
  parent_invoice_id UUID REFERENCES public.internal_invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.employees(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES public.employees(id),
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create internal invoice items table
CREATE TABLE public.internal_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.internal_invoices(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.internal_invoice_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_claim_id UUID REFERENCES public.expense_claims(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice number sequence function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
  next_seq INTEGER;
  invoice_num TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || current_year || '-[0-9]+$')
      THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM public.internal_invoices;
  
  invoice_num := 'INV-' || current_year || '-' || LPAD(next_seq::TEXT, 5, '0');
  RETURN invoice_num;
END;
$$;

-- Create trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON public.internal_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_number();

-- Create triggers for updated_at
CREATE TRIGGER update_internal_invoice_categories_updated_at
  BEFORE UPDATE ON public.internal_invoice_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_invoices_updated_at
  BEFORE UPDATE ON public.internal_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.internal_invoice_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internal_invoice_categories
CREATE POLICY "Admin and HR can manage invoice categories"
  ON public.internal_invoice_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view active categories"
  ON public.internal_invoice_categories
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for internal_invoices
CREATE POLICY "Admin and HR can manage all invoices"
  ON public.internal_invoices
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Store managers can view invoices for their stores"
  ON public.internal_invoices
  FOR SELECT
  USING (
    has_role(auth.uid(), 'store_manager'::app_role) AND (
      from_location_id IN (
        SELECT s.id FROM stores s
        WHERE s.manager_id IN (
          SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
        )
      )
      OR
      to_location_id IN (
        SELECT s.id FROM stores s
        WHERE s.manager_id IN (
          SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for internal_invoice_items
CREATE POLICY "Admin and HR can manage all invoice items"
  ON public.internal_invoice_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Store managers can view items for their store invoices"
  ON public.internal_invoice_items
  FOR SELECT
  USING (
    has_role(auth.uid(), 'store_manager'::app_role) AND (
      invoice_id IN (
        SELECT i.id FROM internal_invoices i
        WHERE i.from_location_id IN (
          SELECT s.id FROM stores s
          WHERE s.manager_id IN (
            SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
          )
        )
        OR i.to_location_id IN (
          SELECT s.id FROM stores s
          WHERE s.manager_id IN (
            SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Insert default invoice categories
INSERT INTO public.internal_invoice_categories (name, code, description) VALUES
  ('IT Services', 'IT', 'IT support, software licenses, hardware'),
  ('HR Services', 'HR', 'Recruitment, training, employee services'),
  ('Maintenance', 'MAINT', 'Building and equipment maintenance'),
  ('Utilities', 'UTIL', 'Electricity, water, internet'),
  ('Office Supplies', 'OFFICE', 'Stationery, furniture, equipment'),
  ('Marketing', 'MKT', 'Advertising, promotions, branding'),
  ('Logistics', 'LOG', 'Shipping, transportation, delivery'),
  ('Inventory Transfer', 'INV', 'Stock transfers between locations'),
  ('Shared Services', 'SHARED', 'Centralized services allocation'),
  ('Other', 'OTHER', 'Miscellaneous expenses');