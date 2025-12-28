import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyAdmins, notifyEmployee } from "@/lib/notificationHelper";

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
    department: {
      id: string;
      name: string;
    } | null;
    profile?: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          *,
          leave_type:leave_types(id, name, code, color),
          employee:employees!leave_requests_employee_id_fkey(
            id,
            employee_id,
            user_id,
            department:departments(id, name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for employees
      const userIds = data?.map(r => r.employee?.user_id).filter(Boolean) as string[] || [];
      let profiles: Record<string, { first_name: string | null; last_name: string | null; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(request => ({
        ...request,
        employee: request.employee ? {
          ...request.employee,
          profile: request.employee.user_id ? profiles[request.employee.user_id] : null
        } : null
      })) as LeaveRequestWithDetails[];
    },
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useMyLeaveRequests(employeeId?: string) {
  return useQuery({
    queryKey: ["my-leave-requests", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          *,
          leave_type:leave_types(id, name, code, color)
        `)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from("leave_requests")
        .insert(request);

      if (error) throw error;
      
      return request;
    },
    onSuccess: async (request) => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      toast.success("Leave request submitted successfully");
      
      // Notify admins about new leave request
      await notifyAdmins(
        "New Leave Request",
        `An employee has submitted a leave request for ${request.days} day(s).`,
        "info",
        "/admin/leaves"
      );
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
        .from("leave_requests")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
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
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status,
          comments,
          approved_by,
          approved_on: status === "approved" || status === "rejected" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
      
      return { id, status, employee_id };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      toast.success(`Leave request ${result.status} successfully`);
      
      // Notify the employee about the status update
      if (result.employee_id && (result.status === "approved" || result.status === "rejected")) {
        const statusText = result.status === "approved" ? "approved" : "rejected";
        const notificationType = result.status === "approved" ? "success" : "warning";
        
        await notifyEmployee(
          result.employee_id,
          `Leave Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          `Your leave request has been ${statusText}.`,
          notificationType,
          "/employee/leaves"
        );
      }
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
      const { error } = await supabase
        .from("leave_types")
        .insert(leaveType);

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
        .from("leave_types")
        .update(data)
        .eq("id", id);

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
        .from("leave_types")
        .delete()
        .eq("id", id);

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
