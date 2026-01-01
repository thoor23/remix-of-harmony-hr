import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";
import type { InternalInvoice, InternalInvoiceCategory, CreateInvoiceInput, InvoiceStats } from "@/types/invoice";

// Invoice Categories
export function useInvoiceCategories() {
  return useQuery({
    queryKey: ['internal-invoice-categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('internal_invoice_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as InternalInvoiceCategory[];
    },
  });
}

export function useCreateInvoiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string; is_active?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: result, error } = await supabase
        .from('internal_invoice_categories')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvoiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InternalInvoiceCategory> }) => {
      const { data: result, error } = await supabase
        .from('internal_invoice_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as InternalInvoiceCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvoiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('internal_invoice_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Invoices
export function useInternalInvoices(filters?: {
  status?: string;
  from_location_id?: string;
  to_location_id?: string;
  invoice_type?: string;
}) {
  return useQuery({
    queryKey: ['internal-invoices', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('internal_invoices')
        .select(`
          *,
          from_location:stores!internal_invoices_from_location_id_fkey(id, name, code, type),
          to_location:stores!internal_invoices_to_location_id_fkey(id, name, code, type),
          items:internal_invoice_items(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.from_location_id) {
        query = query.eq('from_location_id', filters.from_location_id);
      }
      if (filters?.to_location_id) {
        query = query.eq('to_location_id', filters.to_location_id);
      }
      if (filters?.invoice_type) {
        query = query.eq('invoice_type', filters.invoice_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useInternalInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['internal-invoice', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('internal_invoices')
        .select(`
          *,
          from_location:stores!internal_invoices_from_location_id_fkey(id, name, code, type),
          to_location:stores!internal_invoices_to_location_id_fkey(id, name, code, type),
          items:internal_invoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['internal-invoice-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('internal_invoices')
        .select('status, total_amount')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats: InvoiceStats = {
        total_invoices: data.length,
        draft_count: data.filter(i => i.status === 'draft').length,
        sent_count: data.filter(i => i.status === 'sent').length,
        overdue_count: data.filter(i => i.status === 'overdue').length,
        pending_amount: data.filter(i => i.status === 'sent').reduce((sum, i) => sum + (i.total_amount || 0), 0),
        paid_this_month: data.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0),
      };

      return stats;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { items, ...invoiceData } = data;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('internal_invoices')
        .insert([{
          ...invoiceData,
          invoice_number: invoiceNumber,
          company_id: companyId,
          created_by: employeeId,
          subtotal: 0,
          tax_amount: 0,
          total_amount: 0,
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items if provided
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('internal_invoice_items')
          .insert(items.map(item => ({
            ...item,
            invoice_id: invoice.id,
            company_id: companyId,
          })));

        if (itemsError) throw itemsError;
      }

      return invoice as InternalInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateInvoiceInput }) => {
      const { items, ...invoiceData } = data;

      const { data: invoice, error } = await supabase
        .from('internal_invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return invoice as InternalInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('internal_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('internal_invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InternalInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success('Invoice sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_reference }: { id: string; payment_reference?: string }) => {
      const { data, error } = await supabase
        .from('internal_invoices')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          payment_reference 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InternalInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success('Invoice marked as paid');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('internal_invoices')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InternalInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success('Invoice cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useProcessRecurringInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // This would typically be handled by a scheduled function
      // For now, just return 0 processed
      return { processed: 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success(`Processed ${data.processed} recurring invoice(s)`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
