export type LocationType = 'store' | 'office';

export interface Location {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    email?: string;
  };
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  employee_count?: number;
  // Regional settings
  timezone?: string;
  date_format?: string;
  currency?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationAssignment {
  id: string;
  employee_id: string;
  store_id: string;
  is_primary: boolean;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    email?: string;
    phone?: string;
    status: string;
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
  };
  store?: Location;
}

export interface CreateLocationInput {
  name: string;
  code: string;
  type: LocationType;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  opening_time?: string;
  closing_time?: string;
  is_active?: boolean;
  timezone?: string;
  date_format?: string;
  currency?: string;
  locale?: string;
}

export interface AssignEmployeeInput {
  employee_id: string;
  is_primary?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface EmployeeTransfer {
  id: string;
  employee_id: string;
  from_store_id: string | null;
  to_store_id: string;
  transfer_date: string;
  effective_date: string;
  reason?: string;
  notes?: string;
  status: string;
  initiated_by?: string;
  created_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  from_store?: {
    id: string;
    name: string;
    code: string;
  };
  to_store?: {
    id: string;
    name: string;
    code: string;
  };
  initiated_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateTransferInput {
  employee_id: string;
  to_store_id: string;
  effective_date: string;
  reason?: string;
  notes?: string;
}

// Type aliases for backward compatibility
export type Store = Location;
export type Office = Location;
