import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { InternalInvoice, InternalInvoiceCategory, CreateInvoiceInput, InvoiceStats } from "@/types/invoice";

// Invoice Categories
export function useInvoiceCategories() {
  return useQuery({
    queryKey: ['internal-invoice-categories'],
    queryFn: () => api.get<InternalInvoiceCategory[]>('/internal-invoices/categories'),
  });
}

export function useCreateInvoiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InternalInvoiceCategory>) => 
      api.post<InternalInvoiceCategory>('/internal-invoices/categories', data),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<InternalInvoiceCategory> }) => 
      api.put<InternalInvoiceCategory>(`/internal-invoices/categories/${id}`, data),
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
    mutationFn: (id: string) => 
      api.delete<{ success: boolean }>(`/internal-invoices/categories/${id}`),
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
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.from_location_id) params.append('from_location_id', filters.from_location_id);
      if (filters?.to_location_id) params.append('to_location_id', filters.to_location_id);
      if (filters?.invoice_type) params.append('invoice_type', filters.invoice_type);

      const query = params.toString() ? `?${params}` : '';
      return api.get<InternalInvoice[]>(`/internal-invoices${query}`);
    },
  });
}

export function useInternalInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['internal-invoice', id],
    queryFn: () => api.get<InternalInvoice>(`/internal-invoices/${id}`),
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['internal-invoice-stats'],
    queryFn: () => api.get<InvoiceStats>('/internal-invoices/stats'),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => 
      api.post<InternalInvoice>('/internal-invoices', data),
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
    mutationFn: ({ id, data }: { id: string; data: CreateInvoiceInput }) => 
      api.put<InternalInvoice>(`/internal-invoices/${id}`, data),
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
    mutationFn: (id: string) => 
      api.delete<{ success: boolean }>(`/internal-invoices/${id}`),
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
    mutationFn: (id: string) => 
      api.patch<InternalInvoice>(`/internal-invoices/${id}/send`, {}),
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
    mutationFn: ({ id, payment_reference }: { id: string; payment_reference?: string }) => 
      api.patch<InternalInvoice>(`/internal-invoices/${id}/pay`, { payment_reference }),
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
    mutationFn: (id: string) => 
      api.patch<InternalInvoice>(`/internal-invoices/${id}/cancel`, {}),
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
    mutationFn: () => 
      api.post<{ processed: number }>('/internal-invoices/recurring/process'),
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
