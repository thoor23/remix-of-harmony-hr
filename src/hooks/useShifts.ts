import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
    queryFn: () => api.get<ShiftData[]>('/shifts'),
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
      await api.post('/shifts', shift);
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
      await api.put(`/shifts/${id}`, data);
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
      await api.delete(`/shifts/${id}`);
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
    queryFn: () => api.get<any[]>('/shifts/assignments'),
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
      await api.post('/shifts/assignments', assignment);
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
      await api.put(`/shifts/assignments/${id}`, data);
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
      await api.put(`/shifts/assignments/${id}`, { is_active: false });
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
    queryFn: () => api.get<any>(`/shifts/assignments/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}
