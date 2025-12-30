import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AssetMaintenanceRequest, CreateMaintenanceRequestInput } from '@/types/asset';

// Fetch maintenance requests for the current employee
export function useMyMaintenanceRequests() {
  return useQuery({
    queryKey: ['my-maintenance-requests'],
    queryFn: () => api.get<AssetMaintenanceRequest[]>('/assets/maintenance-requests?my=true'),
  });
}

// Fetch all maintenance requests (admin/HR)
export function useAllMaintenanceRequests(filters?: { status?: string; priority?: string }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
  const queryString = params.toString();

  return useQuery({
    queryKey: ['all-maintenance-requests', filters],
    queryFn: () => api.get<AssetMaintenanceRequest[]>(`/assets/maintenance-requests${queryString ? `?${queryString}` : ''}`),
  });
}

// Create a new maintenance request
export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaintenanceRequestInput) =>
      api.post<AssetMaintenanceRequest>('/assets/maintenance-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-maintenance-requests'] });
      toast.success('Maintenance request submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit maintenance request');
    },
  });
}

// Update maintenance request (admin/HR - status change, employee - cancel)
export function useUpdateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; review_comments?: string; assigned_to?: string; scheduled_date?: string; estimated_cost?: number; actual_cost?: number; resolution_notes?: string }) =>
      api.put<AssetMaintenanceRequest>(`/assets/maintenance-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-maintenance-requests'] });
      toast.success('Maintenance request updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update maintenance request');
    },
  });
}

// Cancel maintenance request (employee - only pending requests)
export function useCancelMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.put<AssetMaintenanceRequest>(`/assets/maintenance-requests/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-maintenance-requests'] });
      toast.success('Maintenance request cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel maintenance request');
    },
  });
}
