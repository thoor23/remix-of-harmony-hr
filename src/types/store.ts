export interface Store {
  id: string;
  name: string;
  code: string;
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
  created_at: string;
  updated_at: string;
}

export interface StoreAssignment {
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
  store?: Store;
}

export interface CreateStoreInput {
  name: string;
  code: string;
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
}

export interface AssignEmployeeInput {
  employee_id: string;
  is_primary?: boolean;
  start_date?: string;
  end_date?: string;
}
