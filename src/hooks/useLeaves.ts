import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface LeaveRequestWithDetails {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  comments: string | null;
  approved_by: string | null;
  approved_on: string | null;
  created_at: string;
  updated_at: string;
  leave_type: {
    id: string;
    name: string;
    code: string;
    color: string | null;
  } | null;
  employee: {
    id: string;
    employee_id: string;
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    department: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: () => api.get<LeaveRequestWithDetails[]>('/leaves/requests'),
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: () => api.get<any[]>('/leaves/types'),
  });
}

export function useMyLeaveRequests(employeeId?: string) {
  return useQuery({
    queryKey: ["my-leave-requests", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      return api.get<any[]>(`/leaves/requests/employee/${employeeId}`);
    },
    enabled: !!employeeId,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      employee_id: string;
      leave_type_id: string;
      start_date: string;
      end_date: string;
      days: number;
      reason?: string;
    }) => {
      await api.post('/leaves/requests', request);
      return request;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      toast.success("Leave request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit leave request: ${error.message}`);
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/leaves/requests/${id}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      toast.success("Leave request cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel leave request: ${error.message}`);
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      comments,
      approved_by,
      employee_id,
    }: {
      id: string;
      status: string;
      comments?: string;
      approved_by?: string;
      employee_id?: string;
    }) => {
      await api.patch(`/leaves/requests/${id}`, {
        status,
        comments,
        approved_by,
      });
      return { id, status, employee_id };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      toast.success(`Leave request ${result.status} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update leave request: ${error.message}`);
    },
  });
}

// Leave Types CRUD
export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaveType: {
      name: string;
      code: string;
      max_days: number;
      color?: string;
      carry_forward?: boolean;
      encashable?: boolean;
    }) => {
      await api.post('/leaves/types', leaveType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Leave type created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create leave type: ${error.message}`);
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        code?: string;
        max_days?: number;
        color?: string;
        carry_forward?: boolean;
        encashable?: boolean;
      };
    }) => {
      await api.put(`/leaves/types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Leave type updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update leave type: ${error.message}`);
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leaves/types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Leave type deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete leave type: ${error.message}`);
    },
  });
}
