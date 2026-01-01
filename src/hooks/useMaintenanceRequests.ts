import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AssetMaintenanceRequest, CreateMaintenanceRequestInput } from '@/types/asset';
import { getCurrentCompanyId } from '@/lib/supabase-helpers';
import { useCurrentEmployee } from './useCurrentEmployee';

// Fetch maintenance requests for the current employee
export function useMyMaintenanceRequests() {
  const { data: employee } = useCurrentEmployee();

  return useQuery({
    queryKey: ['my-maintenance-requests', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];

      const { data, error } = await supabase
        .from('asset_maintenance_requests')
        .select(`
          *,
          asset:assets(id, name, asset_tag, brand, model),
          employee:employees!asset_maintenance_requests_employee_id_fkey(id, first_name, last_name, employee_id),
          reviewer:employees!asset_maintenance_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AssetMaintenanceRequest[];
    },
    enabled: !!employee?.id,
  });
}

// Fetch all maintenance requests (admin/HR)
export function useAllMaintenanceRequests(filters?: { status?: string; priority?: string }) {
  return useQuery({
    queryKey: ['all-maintenance-requests', filters],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) return [];

      let query = supabase
        .from('asset_maintenance_requests')
        .select(`
          *,
          asset:assets(id, name, asset_tag, brand, model),
          employee:employees!asset_maintenance_requests_employee_id_fkey(id, first_name, last_name, employee_id),
          reviewer:employees!asset_maintenance_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as AssetMaintenanceRequest[];
    },
  });
}

// Create a new maintenance request
export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();
  const { data: employee } = useCurrentEmployee();

  return useMutation({
    mutationFn: async (data: CreateMaintenanceRequestInput) => {
      const companyId = await getCurrentCompanyId();
      if (!companyId) throw new Error('Company not found');
      if (!employee?.id) throw new Error('Employee not found');

      const { data: result, error } = await supabase
        .from('asset_maintenance_requests')
        .insert({
          company_id: companyId,
          asset_id: data.asset_id,
          employee_id: employee.id,
          type: data.type,
          priority: data.priority || 'medium',
          description: data.description,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return result as AssetMaintenanceRequest;
    },
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
    mutationFn: async ({ id, ...data }: { id: string; status?: string; review_comments?: string; assigned_to?: string; scheduled_date?: string; estimated_cost?: number; actual_cost?: number; resolution_notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // If status is being updated to approved/rejected, add review info
      if (data.status && ['approved', 'rejected', 'in_progress', 'completed'].includes(data.status)) {
        updateData.reviewed_at = new Date().toISOString();
        // Get the employee id for the current user
        const { data: reviewerEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user?.id)
          .maybeSingle();
        if (reviewerEmployee) {
          updateData.reviewed_by = reviewerEmployee.id;
        }
      }

      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from('asset_maintenance_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as AssetMaintenanceRequest;
    },
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
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('asset_maintenance_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as AssetMaintenanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-maintenance-requests'] });
      toast.success('Maintenance request cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel maintenance request');
    },
  });
}
