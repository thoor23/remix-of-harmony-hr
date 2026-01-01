import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export interface AttendanceRegularizationRequest {
  id: string;
  employee_id: string;
  attendance_id: string | null;
  request_date: string;
  request_type: string;
  original_check_in: string | null;
  original_check_out: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
  updated_at: string;
  employee?: any;
  attendance?: any;
  reviewer?: any;
}

export function useMyRegularizationRequests() {
  return useQuery({
    queryKey: ["my-regularization-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      const { data, error } = await supabase
        .from('attendance_regularization_requests')
        .select(`
          *,
          attendance:attendance_records(*)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AttendanceRegularizationRequest[];
    },
  });
}

export function useAllRegularizationRequests(status?: string) {
  return useQuery({
    queryKey: ["all-regularization-requests", status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('attendance_regularization_requests')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url),
          attendance:attendance_records(*),
          reviewer:employees!attendance_regularization_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AttendanceRegularizationRequest[];
    },
  });
}

export function useCreateRegularizationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: {
      request_date: string;
      request_type?: string;
      attendance_id?: string;
      requested_check_in?: string;
      requested_check_out?: string;
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('attendance_regularization_requests')
        .insert([{
          ...requestData,
          employee_id: employeeId,
          company_id: companyId,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-regularization-requests"] });
      toast.success("Regularization request submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}

export function useReviewRegularizationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      review_comments,
    }: {
      id: string;
      status: "approved" | "rejected";
      review_comments?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);

      const { data, error } = await supabase
        .from('attendance_regularization_requests')
        .update({
          status,
          review_comments,
          reviewed_by: employeeId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If approved, update the attendance record
      if (status === 'approved' && data) {
        const request = data as AttendanceRegularizationRequest;
        
        if (request.attendance_id) {
          // Update existing attendance record
          await supabase
            .from('attendance_records')
            .update({
              check_in: request.requested_check_in,
              check_out: request.requested_check_out,
            })
            .eq('id', request.attendance_id);
        } else {
          // Create new attendance record
          const companyId = await getCompanyId(user.id);
          await supabase
            .from('attendance_records')
            .insert([{
              employee_id: request.employee_id,
              company_id: companyId,
              date: request.request_date,
              check_in: request.requested_check_in,
              check_out: request.requested_check_out,
              status: 'present',
            }]);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-regularization-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-regularization-requests"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Request reviewed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to review request: ${error.message}`);
    },
  });
}
