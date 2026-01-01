import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";
import type { 
  Location, 
  LocationType, 
  LocationAssignment, 
  CreateLocationInput, 
  AssignEmployeeInput,
  EmployeeTransfer,
  CreateTransferInput 
} from "@/types/location";

// Re-export types for convenience
export type { Location, LocationType, LocationAssignment, CreateLocationInput, AssignEmployeeInput, EmployeeTransfer, CreateTransferInput };

// Main hook with type filter
export function useLocations(type?: LocationType) {
  return useQuery({
    queryKey: ["locations", type],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('stores')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Location[];
    },
  });
}

// Convenience wrappers
export function useStores() {
  return useLocations('store');
}

export function useOffices() {
  return useLocations('office');
}

export function useAllLocations() {
  return useLocations();
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ["locations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Location;
    },
    enabled: !!id,
  });
}

export function useLocationEmployees(locationId: string) {
  return useQuery({
    queryKey: ["locations", locationId, "employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_store_assignments')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url, status, department:departments(id, name), designation:designations(id, name))
        `)
        .eq('store_id', locationId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!locationId,
  });
}

export function useMyLocations() {
  return useQuery({
    queryKey: ["my-locations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('employee_store_assignments')
        .select(`
          *,
          store:stores(*)
        `)
        .eq('employee_id', employeeId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as LocationAssignment[];
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: CreateLocationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('stores')
        .insert([{ ...location, company_id: companyId }])
        .select()
        .single();

      if (error) throw error;
      return data as Location;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      const typeName = variables.type === 'office' ? 'Office' : 'Store';
      toast.success(`${typeName} created successfully`);
    },
    onError: (error: Error, variables) => {
      const typeName = variables.type === 'office' ? 'office' : 'store';
      toast.error(`Failed to create ${typeName}: ${error.message}`);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...location }: CreateLocationInput & { id: string }) => {
      const { data, error } = await supabase
        .from('stores')
        .update(location)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Location;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations", variables.id] });
      const typeName = data.type === 'office' ? 'Office' : 'Store';
      toast.success(`${typeName} updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

export function useAssignEmployeeToLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, ...data }: AssignEmployeeInput & { locationId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: result, error } = await supabase
        .from('employee_store_assignments')
        .insert([{
          ...data,
          store_id: locationId,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;
      return result as LocationAssignment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations", variables.locationId, "employees"] });
      toast.success("Employee assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign employee: ${error.message}`);
    },
  });
}

export function useRemoveEmployeeFromLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, employeeId }: { locationId: string; employeeId: string }) => {
      const { error } = await supabase
        .from('employee_store_assignments')
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
        .eq('store_id', locationId)
        .eq('employee_id', employeeId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations", variables.locationId, "employees"] });
      toast.success("Employee removed from location");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove employee: ${error.message}`);
    },
  });
}

export function useEmployeeTransfers(employeeId?: string, locationId?: string) {
  return useQuery({
    queryKey: ["employee-transfers", { employeeId, locationId }],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('employee_transfers')
        .select(`
          *,
          from_store:stores!employee_transfers_from_store_id_fkey(id, name, code),
          to_store:stores!employee_transfers_to_store_id_fkey(id, name, code)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (locationId) {
        query = query.or(`from_store_id.eq.${locationId},to_store_id.eq.${locationId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch employee data separately
      const employeeIds = [...new Set((data || []).map(t => t.employee_id))];
      const { data: employees } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name')
        .in('id', employeeIds);
      
      const employeeMap = new Map((employees || []).map(e => [e.id, e]));
      
      return (data || []).map(t => ({
        ...t,
        employee: employeeMap.get(t.employee_id)
      })) as EmployeeTransfer[];
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransferInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: result, error } = await supabase
        .from('employee_transfers')
        .insert([{
          ...data,
          company_id: companyId,
          initiated_by: employeeId,
          status: 'completed',
          transfer_date: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (error) throw error;
      return result as EmployeeTransfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee transferred successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to transfer employee: ${error.message}`);
    },
  });
}
