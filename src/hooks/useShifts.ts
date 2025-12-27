import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ShiftData[];
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
      const { error } = await supabase
        .from("shifts")
        .insert(shift);

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
        .from("shifts")
        .update(data)
        .eq("id", id);

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
        .from("shifts")
        .delete()
        .eq("id", id);

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
      const { data, error } = await supabase
        .from("shift_assignments")
        .select(`
          *,
          shift:shifts(*),
          employee:employees(
            id,
            employee_id,
            user_id,
            department:departments(id, name)
          )
        `)
        .eq("is_active", true);

      if (error) throw error;

      // Fetch profiles
      const userIds = data?.map(a => a.employee?.user_id).filter(Boolean) || [];
      let profiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(assignment => ({
        ...assignment,
        employee: assignment.employee ? {
          ...assignment.employee,
          profile: assignment.employee.user_id ? profiles[assignment.employee.user_id] : null
        } : null
      }));
    },
  });
}

export function useCreateShiftAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: {
      employee_id: string;
      shift_id: string;
      start_date: string;
      end_date?: string;
    }) => {
      const { error } = await supabase
        .from("shift_assignments")
        .insert(assignment);

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
        start_date?: string;
        end_date?: string;
        is_active?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from("shift_assignments")
        .update(data)
        .eq("id", id);

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
        .from("shift_assignments")
        .update({ is_active: false })
        .eq("id", id);

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
      const { data, error } = await supabase
        .from("shift_assignments")
        .select(`
          *,
          shift:shifts(*)
        `)
        .eq("employee_id", employeeId!)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}
