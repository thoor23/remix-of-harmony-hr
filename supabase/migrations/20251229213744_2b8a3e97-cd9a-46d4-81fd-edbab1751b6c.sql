-- Create asset_categories table
CREATE TABLE public.asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'Package',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create assets table
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES public.asset_categories(id),
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_cost numeric DEFAULT 0,
  warranty_expiry date,
  status text NOT NULL DEFAULT 'available',
  condition text DEFAULT 'good',
  location_id uuid REFERENCES public.stores(id),
  assigned_to uuid REFERENCES public.employees(id),
  assigned_date date,
  notes text,
  image_url text,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create asset_assignments table (history)
CREATE TABLE public.asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.employees(id) NOT NULL,
  location_id uuid REFERENCES public.stores(id),
  assigned_by uuid REFERENCES public.employees(id),
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  returned_date date,
  condition_on_assign text,
  condition_on_return text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create asset_transfers table
CREATE TABLE public.asset_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  from_location_id uuid REFERENCES public.stores(id),
  to_location_id uuid REFERENCES public.stores(id) NOT NULL,
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  transferred_by uuid REFERENCES public.employees(id),
  notes text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create asset_maintenance table
CREATE TABLE public.asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'service',
  description text,
  cost numeric DEFAULT 0,
  vendor text,
  scheduled_date date,
  completed_date date,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES public.employees(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_categories
CREATE POLICY "Admin and HR can manage asset categories"
ON public.asset_categories FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Authenticated users can view active categories"
ON public.asset_categories FOR SELECT
USING (is_active = true);

-- RLS Policies for assets
CREATE POLICY "Admin and HR can manage all assets"
ON public.assets FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Store managers can view assets in their stores"
ON public.assets FOR SELECT
USING (
  has_role(auth.uid(), 'store_manager') AND
  location_id IN (
    SELECT id FROM public.stores 
    WHERE manager_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Employees can view their assigned assets"
ON public.assets FOR SELECT
USING (
  assigned_to IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- RLS Policies for asset_assignments
CREATE POLICY "Admin and HR can manage all assignments"
ON public.asset_assignments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can view their own assignments"
ON public.asset_assignments FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- RLS Policies for asset_transfers
CREATE POLICY "Admin and HR can manage all transfers"
ON public.asset_transfers FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Store managers can view transfers for their stores"
ON public.asset_transfers FOR SELECT
USING (
  has_role(auth.uid(), 'store_manager') AND
  (from_location_id IN (
    SELECT id FROM public.stores 
    WHERE manager_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  ) OR to_location_id IN (
    SELECT id FROM public.stores 
    WHERE manager_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  ))
);

-- RLS Policies for asset_maintenance
CREATE POLICY "Admin and HR can manage all maintenance"
ON public.asset_maintenance FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Store managers can view maintenance for their store assets"
ON public.asset_maintenance FOR SELECT
USING (
  has_role(auth.uid(), 'store_manager') AND
  asset_id IN (
    SELECT id FROM public.assets 
    WHERE location_id IN (
      SELECT id FROM public.stores 
      WHERE manager_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_asset_categories_updated_at
BEFORE UPDATE ON public.asset_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_transfers_updated_at
BEFORE UPDATE ON public.asset_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_maintenance_updated_at
BEFORE UPDATE ON public.asset_maintenance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.asset_categories (name, code, description, icon) VALUES
('Laptops', 'LAPTOP', 'Laptop computers and notebooks', 'Laptop'),
('Phones', 'PHONE', 'Mobile phones and tablets', 'Smartphone'),
('Furniture', 'FURN', 'Office furniture', 'Armchair'),
('Vehicles', 'VEH', 'Company vehicles', 'Car'),
('Equipment', 'EQUIP', 'General equipment and tools', 'Wrench');