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

// Asset Categories
export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as AssetCategory[];
    },
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<AssetCategory>) => {
      const { data, error } = await supabase
        .from('asset_categories')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      return data;
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
        .update({ is_active: false })
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
      let query = supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          location:stores!assets_location_id_fkey(id, name, code, type),
          assignee:employees!assets_assigned_to_fkey(id, first_name, last_name, employee_id)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.location_id) {
        query = query.eq('location_id', filters.location_id);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Asset[];
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
          location:stores!assets_location_id_fkey(id, name, code, type),
          assignee:employees!assets_assigned_to_fkey(id, first_name, last_name, employee_id)
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
      const { data, error } = await supabase
        .from('assets')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('assets')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase.from('assets').delete().eq('id', id);
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
      let query = supabase
        .from('asset_assignments')
        .select(`
          *,
          asset:assets(*),
          employee:employees!asset_assignments_employee_id_fkey(id, first_name, last_name, employee_id),
          assigned_by_employee:employees!asset_assignments_assigned_by_fkey(id, first_name, last_name),
          location:stores(id, name, code)
        `)
        .order('assigned_date', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AssetAssignment[];
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AssignAssetInput) => {
      // Get current user's employee id
      const { data: userData } = await supabase.auth.getUser();
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single();

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('asset_assignments')
        .insert({
          asset_id: input.asset_id,
          employee_id: input.employee_id,
          location_id: input.location_id,
          assigned_by: currentEmployee?.id,
          condition_on_assign: input.condition_on_assign,
          notes: input.notes,
        });

      if (assignmentError) throw assignmentError;

      // Update asset
      const { error: assetError } = await supabase
        .from('assets')
        .update({
          assigned_to: input.employee_id,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned',
        })
        .eq('id', input.asset_id);

      if (assetError) throw assetError;
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
      // Get the latest assignment
      const { data: assignment } = await supabase
        .from('asset_assignments')
        .select('id')
        .eq('asset_id', assetId)
        .is('returned_date', null)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .single();

      if (assignment) {
        // Update assignment with return info
        await supabase
          .from('asset_assignments')
          .update({
            returned_date: new Date().toISOString().split('T')[0],
            condition_on_return: conditionOnReturn,
            notes: notes,
          })
          .eq('id', assignment.id);
      }

      // Update asset
      const { error } = await supabase
        .from('assets')
        .update({
          assigned_to: null,
          assigned_date: null,
          status: 'available',
          condition: conditionOnReturn || 'good',
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
      let query = supabase
        .from('asset_transfers')
        .select(`
          *,
          asset:assets(id, asset_tag, name),
          from_location:stores!asset_transfers_from_location_id_fkey(id, name, code, type),
          to_location:stores!asset_transfers_to_location_id_fkey(id, name, code, type),
          transferred_by_employee:employees!asset_transfers_transferred_by_fkey(id, first_name, last_name)
        `)
        .order('transfer_date', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }
      if (locationId) {
        query = query.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AssetTransfer[];
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferAssetInput) => {
      // Get current asset location
      const { data: asset } = await supabase
        .from('assets')
        .select('location_id')
        .eq('id', input.asset_id)
        .single();

      // Get current user's employee id
      const { data: userData } = await supabase.auth.getUser();
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single();

      // Create transfer record
      const { error: transferError } = await supabase
        .from('asset_transfers')
        .insert({
          asset_id: input.asset_id,
          from_location_id: asset?.location_id,
          to_location_id: input.to_location_id,
          reason: input.reason,
          notes: input.notes,
          transferred_by: currentEmployee?.id,
          status: 'completed',
        });

      if (transferError) throw transferError;

      // Update asset location
      const { error: assetError } = await supabase
        .from('assets')
        .update({ location_id: input.to_location_id })
        .eq('id', input.asset_id);

      if (assetError) throw assetError;
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
      let query = supabase
        .from('asset_maintenance')
        .select(`
          *,
          asset:assets(id, asset_tag, name),
          created_by_employee:employees!asset_maintenance_created_by_fkey(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AssetMaintenance[];
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMaintenanceInput) => {
      // Get current user's employee id
      const { data: userData } = await supabase.auth.getUser();
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single();

      const { data, error } = await supabase
        .from('asset_maintenance')
        .insert({
          ...input,
          created_by: currentEmployee?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update asset status if maintenance is scheduled
      if (input.scheduled_date) {
        await supabase
          .from('assets')
          .update({ status: 'maintenance' })
          .eq('id', input.asset_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      toast.success('Maintenance record created successfully');
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

      // If maintenance is completed, update asset status
      if (input.status === 'completed' && input.asset_id) {
        await supabase
          .from('assets')
          .update({ status: 'available' })
          .eq('id', input.asset_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      toast.success('Maintenance record updated successfully');
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
      const { data: assets, error } = await supabase
        .from('assets')
        .select('status, category_id, location_id, purchase_cost');

      if (error) throw error;

      const totalAssets = assets?.length || 0;
      const totalValue = assets?.reduce((sum, a) => sum + (a.purchase_cost || 0), 0) || 0;
      const byStatus = {
        available: assets?.filter(a => a.status === 'available').length || 0,
        assigned: assets?.filter(a => a.status === 'assigned').length || 0,
        maintenance: assets?.filter(a => a.status === 'maintenance').length || 0,
        retired: assets?.filter(a => a.status === 'retired').length || 0,
      };

      return { totalAssets, totalValue, byStatus };
    },
  });
}
