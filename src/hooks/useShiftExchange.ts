import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ShiftExchangeRequest {
  id: string;
  requester_id: string;
  target_employee_id: string;
  requester_shift_id: string;
  target_shift_id: string;
  request_date: string;
  reason: string | null;
  status: string;
  response_note: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Flattened backend fields
  requester_emp_code?: string;
  requester_first_name?: string;
  requester_last_name?: string;
  target_emp_code?: string;
  target_first_name?: string;
  target_last_name?: string;
  requester_shift_name?: string;
  requester_shift_color?: string;
  target_shift_name?: string;
  target_shift_color?: string;
  requester?: {
    id: string;
    employee_id: string;
    user_id: string | null;
    profile?: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
  target_employee?: {
    id: string;
    employee_id: string;
    user_id: string | null;
    profile?: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
  requester_shift?: {
    id: string;
    name: string;
    code: string;
    color: string | null;
    start_time: string;
    end_time: string;
  } | null;
  target_shift?: {
    id: string;
    name: string;
    code: string;
    color: string | null;
    start_time: string;
    end_time: string;
  } | null;
}

export function useShiftExchangeRequests() {
  return useQuery({
    queryKey: ["shift-exchange-requests"],
    queryFn: async () => {
      return api.get<ShiftExchangeRequest[]>("/shifts/exchange-requests");
    },
  });
}

export function useMyShiftExchangeRequests(employeeId?: string) {
  return useQuery({
    queryKey: ["my-shift-exchange-requests", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      // Use /my endpoint which uses auth context
      return api.get<ShiftExchangeRequest[]>('/shifts/exchange-requests/my');
    },
    enabled: !!employeeId,
  });
}

export function useCreateShiftExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      requester_id: string;
      target_employee_id: string;
      requester_shift_id: string;
      target_shift_id: string;
      request_date: string;
      reason?: string;
    }) => {
      return api.post<ShiftExchangeRequest>("/shifts/exchange-requests", request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-shift-exchange-requests"] });
      toast.success("Shift exchange request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}

export function useUpdateShiftExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      response_note,
    }: {
      id: string;
      status: string;
      response_note?: string;
      requester_id?: string;
    }) => {
      // Backend uses PUT, not PATCH
      return api.put<ShiftExchangeRequest>(`/shifts/exchange-requests/${id}`, {
        status,
        response_note,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shift-exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-shift-exchange-requests"] });
      toast.success(`Request ${variables.status} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update request: ${error.message}`);
    },
  });
}

export function useCancelShiftExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Backend uses PUT, not PATCH
      return api.put(`/shifts/exchange-requests/${id}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-shift-exchange-requests"] });
      toast.success("Request cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel request: ${error.message}`);
    },
  });
}
