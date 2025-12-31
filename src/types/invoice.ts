export interface InternalInvoiceCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternalInvoiceItem {
  id: string;
  invoice_id: string;
  category_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  expense_claim_id?: string;
  created_at: string;
  category?: InternalInvoiceCategory;
}

export interface InternalInvoice {
  id: string;
  invoice_number: string;
  from_location_id: string;
  to_location_id: string;
  invoice_type: 'expense_reimbursement' | 'internal_service' | 'goods_transfer';
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_recurring_date?: string;
  parent_invoice_id?: string;
  created_by?: string;
  paid_at?: string;
  paid_by?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  // Joined data
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
  items?: InternalInvoiceItem[];
  created_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

export interface CreateInvoiceInput {
  from_location_id: string;
  to_location_id: string;
  invoice_type: 'expense_reimbursement' | 'internal_service' | 'goods_transfer';
  invoice_date: string;
  due_date: string;
  tax_rate?: number;
  notes?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  items: CreateInvoiceItemInput[];
}

export interface CreateInvoiceItemInput {
  category_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  expense_claim_id?: string;
}

export interface InvoiceStats {
  total_invoices: number;
  pending_amount: number;
  paid_this_month: number;
  overdue_count: number;
  draft_count: number;
  sent_count: number;
}
