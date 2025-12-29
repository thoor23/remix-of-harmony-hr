import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
    queryFn: () => api.get<AssetCategory[]>('/assets/categories'),
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; code: string; description?: string; icon?: string }) =>
      api.post<AssetCategory>('/assets/categories', input),
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
    mutationFn: ({ id, ...input }: Partial<AssetCategory> & { id: string }) =>
      api.put<AssetCategory>(`/assets/categories/${id}`, input),
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
    mutationFn: (id: string) => api.delete(`/assets/categories/${id}`),
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
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category_id) params.set('category_id', filters.category_id);
      if (filters?.location_id) params.set('location_id', filters.location_id);
      if (filters?.search) params.set('search', filters.search);
      
      const queryString = params.toString();
      return api.get<Asset[]>(`/assets${queryString ? `?${queryString}` : ''}`);
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => api.get<Asset>(`/assets/${id}`),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetInput) => api.post<Asset>('/assets', input),
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
    mutationFn: ({ id, ...input }: UpdateAssetInput) => api.put<Asset>(`/assets/${id}`, input),
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
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
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
    queryFn: () => {
      const params = assetId ? `?asset_id=${assetId}` : '';
      return api.get<AssetAssignment[]>(`/assets/assignments${params}`);
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignAssetInput) => api.post('/assets/assign', input),
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
    mutationFn: ({ assetId, conditionOnReturn, notes }: { assetId: string; conditionOnReturn?: string; notes?: string }) =>
      api.post('/assets/unassign', { asset_id: assetId, condition_on_return: conditionOnReturn, notes }),
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
    queryFn: () => {
      const params = new URLSearchParams();
      if (assetId) params.set('asset_id', assetId);
      if (locationId) params.set('location_id', locationId);
      const queryString = params.toString();
      return api.get<AssetTransfer[]>(`/assets/transfers${queryString ? `?${queryString}` : ''}`);
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransferAssetInput) => api.post('/assets/transfer', input),
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
    queryFn: () => {
      const params = assetId ? `?asset_id=${assetId}` : '';
      return api.get<AssetMaintenance[]>(`/assets/maintenance${params}`);
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMaintenanceInput) => api.post<AssetMaintenance>('/assets/maintenance', input),
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
    mutationFn: ({ id, ...input }: Partial<AssetMaintenance> & { id: string }) =>
      api.put<AssetMaintenance>(`/assets/maintenance/${id}`, input),
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
    queryFn: () => api.get<{
      totalAssets: number;
      totalValue: number;
      byStatus: {
        available: number;
        assigned: number;
        maintenance: number;
        retired: number;
      };
    }>('/assets/stats'),
  });
}
