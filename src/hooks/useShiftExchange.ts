import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId } from "@/lib/supabase-helpers";

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
    first_name: string | null;
    last_name: string | null;
  } | null;
  target_employee?: {
    id: string;
    employee_id: string;
    first_name: string | null;
    last_name: string | null;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, first_name, last_name),
          target_employee:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, first_name, last_name),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(id, name, code, color, start_time, end_time),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(id, name, code, color, start_time, end_time)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ShiftExchangeRequest[];
    },
  });
}

export function useMyShiftExchangeRequests(employeeId?: string) {
  return useQuery({
    queryKey: ["my-shift-exchange-requests", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, first_name, last_name),
          target_employee:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, first_name, last_name),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(id, name, code, color, start_time, end_time),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(id, name, code, color, start_time, end_time)
        `)
        .or(`requester_id.eq.${employeeId},target_employee_id.eq.${employeeId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ShiftExchangeRequest[];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('shift_exchange_requests')
        .insert([{
          ...request,
          company_id: companyId,
          status: 'pending',
        }]);

      if (error) throw error;
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
      const { error } = await supabase
        .from('shift_exchange_requests')
        .update({
          status,
          response_note,
          responded_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('shift_exchange_requests')
        .update({ status: "cancelled" })
        .eq('id', id);

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
