import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InternalInvoice, InternalInvoiceCategory, CreateInvoiceInput, InvoiceStats } from "@/types/invoice";

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-internal-invoices`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Invoice Categories
export function useInvoiceCategories() {
  return useQuery({
    queryKey: ['internal-invoice-categories'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/categories`, { headers });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as Promise<InternalInvoiceCategory[]>;
    },
  });
}

export function useCreateInvoiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InternalInvoiceCategory>) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.from_location_id) params.append('from_location_id', filters.from_location_id);
      if (filters?.to_location_id) params.append('to_location_id', filters.to_location_id);
      if (filters?.invoice_type) params.append('invoice_type', filters.invoice_type);

      const url = params.toString() ? `${API_URL}?${params}` : API_URL;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json() as Promise<InternalInvoice[]>;
    },
  });
}

export function useInternalInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['internal-invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/${id}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch invoice');
      return response.json() as Promise<InternalInvoice>;
    },
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['internal-invoice-stats'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/stats`, { headers });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as Promise<InvoiceStats>;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      const headers = await getAuthHeaders();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update invoice');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/${id}/send`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invoice');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/${id}/pay`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ payment_reference }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark invoice as paid');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/${id}/cancel`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invoice');
      }
      return response.json();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/recurring/process`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process recurring invoices');
      }
      return response.json();
    },
    onSuccess: (data: { processed: number }) => {
      queryClient.invalidateQueries({ queryKey: ['internal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['internal-invoice-stats'] });
      toast.success(`Processed ${data.processed} recurring invoice(s)`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
