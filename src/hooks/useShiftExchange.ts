import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyAdmins, notifyEmployee } from "@/lib/notificationHelper";

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
      const { data, error } = await supabase
        .from("shift_exchange_requests")
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, user_id),
          target_employee:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, user_id),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(id, name, code, color, start_time, end_time),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(id, name, code, color, start_time, end_time)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles
      const userIds = [
        ...(data?.map(r => r.requester?.user_id).filter(Boolean) || []),
        ...(data?.map(r => r.target_employee?.user_id).filter(Boolean) || [])
      ] as string[];
      
      let profiles: Record<string, { first_name: string | null; last_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(request => ({
        ...request,
        requester: request.requester ? {
          ...request.requester,
          profile: request.requester.user_id ? profiles[request.requester.user_id] : null
        } : null,
        target_employee: request.target_employee ? {
          ...request.target_employee,
          profile: request.target_employee.user_id ? profiles[request.target_employee.user_id] : null
        } : null
      })) as ShiftExchangeRequest[];
    },
  });
}

export function useMyShiftExchangeRequests(employeeId?: string) {
  return useQuery({
    queryKey: ["my-shift-exchange-requests", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from("shift_exchange_requests")
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, user_id),
          target_employee:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, user_id),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(id, name, code, color, start_time, end_time),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(id, name, code, color, start_time, end_time)
        `)
        .or(`requester_id.eq.${employeeId},target_employee_id.eq.${employeeId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles
      const userIds = [
        ...(data?.map(r => r.requester?.user_id).filter(Boolean) || []),
        ...(data?.map(r => r.target_employee?.user_id).filter(Boolean) || [])
      ] as string[];
      
      let profiles: Record<string, { first_name: string | null; last_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(request => ({
        ...request,
        requester: request.requester ? {
          ...request.requester,
          profile: request.requester.user_id ? profiles[request.requester.user_id] : null
        } : null,
        target_employee: request.target_employee ? {
          ...request.target_employee,
          profile: request.target_employee.user_id ? profiles[request.target_employee.user_id] : null
        } : null
      })) as ShiftExchangeRequest[];
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
      const { error } = await supabase
        .from("shift_exchange_requests")
        .insert(request);

      if (error) throw error;
      
      return request;
    },
    onSuccess: async (request) => {
      queryClient.invalidateQueries({ queryKey: ["shift-exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-shift-exchange-requests"] });
      toast.success("Shift exchange request submitted successfully");
      
      // Notify the target employee about the request
      await notifyEmployee(
        request.target_employee_id,
        "New Shift Exchange Request",
        "You have received a shift exchange request from a colleague.",
        "info",
        "/employee/shift-exchange"
      );
      
      // Also notify admins
      await notifyAdmins(
        "New Shift Exchange Request",
        "An employee has submitted a shift exchange request.",
        "info",
        "/admin/shifts/exchange"
      );
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
      requester_id,
    }: {
      id: string;
      status: string;
      response_note?: string;
      requester_id?: string;
    }) => {
      const { error } = await supabase
        .from("shift_exchange_requests")
        .update({
          status,
          response_note,
          responded_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      
      return { id, status, requester_id };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["shift-exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-shift-exchange-requests"] });
      toast.success(`Request ${result.status} successfully`);
      
      // Notify the requester about the status update
      if (result.requester_id && (result.status === "approved" || result.status === "rejected")) {
        const statusText = result.status === "approved" ? "accepted" : "declined";
        const notificationType = result.status === "approved" ? "success" : "warning";
        
        await notifyEmployee(
          result.requester_id,
          `Shift Exchange ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          `Your shift exchange request has been ${statusText}.`,
          notificationType,
          "/employee/shift-exchange"
        );
      }
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
      const { error } = await supabase
        .from("shift_exchange_requests")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
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
