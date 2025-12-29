export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  category_id: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number;
  warranty_expiry: string | null;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  condition: 'new' | 'good' | 'fair' | 'poor';
  location_id: string | null;
  assigned_to: string | null;
  assigned_date: string | null;
  notes: string | null;
  image_url: string | null;
  specifications: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: AssetCategory;
  location?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  location_id: string | null;
  assigned_by: string | null;
  assigned_date: string;
  returned_date: string | null;
  condition_on_assign: string | null;
  condition_on_return: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  asset?: Asset;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  assigned_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  location?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface AssetTransfer {
  id: string;
  asset_id: string;
  from_location_id: string | null;
  to_location_id: string;
  transfer_date: string;
  reason: string | null;
  transferred_by: string | null;
  notes: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined data
  asset?: Asset;
  from_location?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  to_location?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  transferred_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  type: 'repair' | 'service' | 'upgrade';
  description: string | null;
  cost: number;
  vendor: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  asset?: Asset;
  created_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateAssetInput {
  asset_tag: string;
  name: string;
  category_id?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string;
  status?: string;
  condition?: string;
  location_id?: string;
  notes?: string;
  specifications?: Record<string, unknown>;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  id: string;
}

export interface AssignAssetInput {
  asset_id: string;
  employee_id: string;
  location_id?: string;
  condition_on_assign?: string;
  notes?: string;
}

export interface TransferAssetInput {
  asset_id: string;
  to_location_id: string;
  reason?: string;
  notes?: string;
}

export interface CreateMaintenanceInput {
  asset_id: string;
  type: string;
  description?: string;
  cost?: number;
  vendor?: string;
  scheduled_date?: string;
  notes?: string;
}

export interface AssetFilters {
  status?: string;
  category_id?: string;
  location_id?: string;
  assigned_to?: string;
  condition?: string;
  search?: string;
}
