import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Asset,
  AssetCategory,
  AssetAssignment,
  AssetTransfer,
  AssetMaintenance,
  CreateAssetInput,
  UpdateAssetInput,
  AssignAssetInput,
  TransferAssetInput,
  CreateMaintenanceInput,
  AssetFilters,
} from '@/types/asset';
import { toast } from 'sonner';
import { getCompanyId, getEmployeeId } from '@/lib/supabase-helpers';

// Asset Categories
export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as AssetCategory[];
    },
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; code: string; description?: string; icon?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('asset_categories')
        .insert([{ ...input, company_id: companyId }])
        .select()
        .single();

      if (error) throw error;
      return data as AssetCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message);
    },
  });
}

export function useUpdateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AssetCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('asset_categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AssetCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('asset_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });
}

// Assets
export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          assigned_employee:employees!assets_assigned_to_fkey(id, first_name, last_name, employee_id)
        `)
        .eq('company_id', companyId);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.category_id) query = query.eq('category_id', filters.category_id);
      if (filters?.location_id) query = query.eq('location_id', filters.location_id);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      const { data, error } = await query.order('name');

      if (error) throw error;
      return (data || []) as Asset[];
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          assigned_employee:employees!assets_assigned_to_fkey(id, first_name, last_name, employee_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Asset;
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const insertData: any = { ...input, company_id: companyId };
      
      const { data, error } = await supabase
        .from('assets')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create asset: ' + error.message);
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAssetInput) => {
      const updateData: any = { ...input };
      
      const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Asset;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
      toast.success('Asset updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update asset: ' + error.message);
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete asset: ' + error.message);
    },
  });
}

// Asset Assignments
export function useAssetAssignments(assetId?: string) {
  return useQuery({
    queryKey: ['asset-assignments', assetId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('asset_assignments')
        .select(`
          *,
          asset:assets(*),
          employee:employees!asset_assignments_employee_id_fkey(id, first_name, last_name, employee_id)
        `)
        .eq('company_id', companyId);

      if (assetId) query = query.eq('asset_id', assetId);

      const { data, error } = await query.order('assigned_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as AssetAssignment[];
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AssignAssetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const employeeId = await getEmployeeId(user.id);

      // Create assignment record
      const { error: assignError } = await supabase
        .from('asset_assignments')
        .insert([{
          asset_id: input.asset_id,
          employee_id: input.employee_id,
          company_id: companyId,
          assigned_by: employeeId,
          condition_on_assign: input.condition_on_assign,
          notes: input.notes,
        }]);

      if (assignError) throw assignError;

      // Update asset status
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          assigned_to: input.employee_id,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned',
        })
        .eq('id', input.asset_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      toast.success('Asset assigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to assign asset: ' + error.message);
    },
  });
}

export function useUnassignAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, conditionOnReturn, notes }: { assetId: string; conditionOnReturn?: string; notes?: string }) => {
      // Update the latest assignment record
      const { data: assignment } = await supabase
        .from('asset_assignments')
        .select('id')
        .eq('asset_id', assetId)
        .is('returned_date', null)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .single();

      if (assignment) {
        await supabase
          .from('asset_assignments')
          .update({
            returned_date: new Date().toISOString().split('T')[0],
            condition_on_return: conditionOnReturn,
            notes,
          })
          .eq('id', assignment.id);
      }

      // Update asset status
      const { error } = await supabase
        .from('assets')
        .update({
          assigned_to: null,
          assigned_date: null,
          status: 'available',
        })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      toast.success('Asset unassigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to unassign asset: ' + error.message);
    },
  });
}

// Asset Transfers
export function useAssetTransfers(assetId?: string, locationId?: string) {
  return useQuery({
    queryKey: ['asset-transfers', assetId, locationId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('asset_transfers')
        .select('*')
        .eq('company_id', companyId);

      if (assetId) query = query.eq('asset_id', assetId);
      if (locationId) query = query.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`);

      const { data, error } = await query.order('transfer_date', { ascending: false });

      if (error) throw error;
      return (data || []) as AssetTransfer[];
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferAssetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const employeeId = await getEmployeeId(user.id);

      const { error } = await supabase
        .from('asset_transfers')
        .insert([{
          ...input,
          company_id: companyId,
          transferred_by: employeeId,
          status: 'completed',
        }]);

      if (error) throw error;

      // Update asset location
      await supabase
        .from('assets')
        .update({ location_id: input.to_location_id })
        .eq('id', input.asset_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-transfers'] });
      toast.success('Asset transferred successfully');
    },
    onError: (error) => {
      toast.error('Failed to transfer asset: ' + error.message);
    },
  });
}

// Asset Maintenance
export function useAssetMaintenance(assetId?: string) {
  return useQuery({
    queryKey: ['asset-maintenance', assetId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('asset_maintenance')
        .select('*')
        .eq('company_id', companyId);

      if (assetId) query = query.eq('asset_id', assetId);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AssetMaintenance[];
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMaintenanceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const employeeId = await getEmployeeId(user.id);

      const { data, error } = await supabase
        .from('asset_maintenance')
        .insert([{
          ...input,
          company_id: companyId,
          created_by: employeeId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as AssetMaintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      toast.success('Maintenance record created');
    },
    onError: (error) => {
      toast.error('Failed to create maintenance record: ' + error.message);
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AssetMaintenance> & { id: string }) => {
      const { data, error } = await supabase
        .from('asset_maintenance')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AssetMaintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      toast.success('Maintenance record updated');
    },
    onError: (error) => {
      toast.error('Failed to update maintenance record: ' + error.message);
    },
  });
}

// Asset Stats
export function useAssetStats() {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('assets')
        .select('status, purchase_cost')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats = {
        totalAssets: data?.length || 0,
        totalValue: 0,
        byStatus: {
          available: 0,
          assigned: 0,
          maintenance: 0,
          retired: 0,
        },
      };

      data?.forEach((asset: any) => {
        stats.totalValue += asset.purchase_cost || 0;
        if (asset.status in stats.byStatus) {
          stats.byStatus[asset.status as keyof typeof stats.byStatus]++;
        }
      });

      return stats;
    },
  });
}
