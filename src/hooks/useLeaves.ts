import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

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
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(*),
          employee:employees!leave_requests_employee_id_fkey(
            id, employee_id, user_id, first_name, last_name, avatar_url,
            department:departments(id, name)
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as LeaveRequestWithDetails[];
    },
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: ["my-leave-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(*)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('leave_requests')
        .insert([{
          ...request,
          company_id: companyId,
          status: 'pending',
        }]);

      if (error) throw error;
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
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
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
    }: {
      id: string;
      status: string;
      comments?: string;
      approved_by?: string;
      employee_id?: string;
    }) => {
      const updateData: any = { status };
      if (comments !== undefined) updateData.comments = comments;
      if (approved_by) {
        updateData.approved_by = approved_by;
        updateData.approved_on = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { id, status };
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('leave_types')
        .insert([{
          ...leaveType,
          company_id: companyId,
        }]);

      if (error) throw error;
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
      const { error } = await supabase
        .from('leave_types')
        .update(data)
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('leave_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
