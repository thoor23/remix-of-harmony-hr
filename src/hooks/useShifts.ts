import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export interface ShiftData {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  break_duration: number | null;
  color: string | null;
  is_active: boolean | null;
  created_at: string;
}

export function useShifts() {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as ShiftData[];
    },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shift: {
      name: string;
      code: string;
      start_time: string;
      end_time: string;
      break_duration?: number;
      color?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('shifts')
        .insert([{
          ...shift,
          company_id: companyId,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create shift: ${error.message}`);
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShiftData> }) => {
      const { error } = await supabase
        .from('shifts')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update shift: ${error.message}`);
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete shift: ${error.message}`);
    },
  });
}

export function useShiftAssignments() {
  return useQuery({
    queryKey: ["shift-assignments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url, department:departments(id, name)),
          shift:shifts(*),
          store:stores(id, name)
        `)
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateShiftAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: {
      employee_id: string;
      shift_id: string;
      store_id?: string;
      start_date: string;
      end_date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('shift_assignments')
        .insert([{
          ...assignment,
          company_id: companyId,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
      toast.success("Shift assignment created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create shift assignment: ${error.message}`);
    },
  });
}

export function useUpdateShiftAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        shift_id?: string;
        store_id?: string;
        start_date?: string;
        end_date?: string;
        is_active?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from('shift_assignments')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
      toast.success("Shift assignment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update shift assignment: ${error.message}`);
    },
  });
}

export function useDeleteShiftAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shift_assignments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
      toast.success("Shift assignment removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove shift assignment: ${error.message}`);
    },
  });
}

export function useMyShiftAssignment(employeeId?: string) {
  return useQuery({
    queryKey: ["my-shift-assignment", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          *,
          shift:shifts(*)
        `)
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });
}
