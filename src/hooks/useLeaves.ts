import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
  approved_by: string | null;
  approved_on: string | null;
  employee: {
    employee_id: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  leave_type: {
    id: string;
    name: string;
    code: string;
    color: string | null;
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
          leave_type:leave_types(id, name, code, color)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch employee details
      const employeeIds = data?.map(r => r.employee_id) || [];
      const { data: employees } = await supabase
        .from("employees")
        .select("id, employee_id, user_id")
        .in("id", employeeIds);

      const userIds = employees?.filter(e => e.user_id).map(e => e.user_id) || [];
      let profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds);
        profilesData?.forEach(p => { profiles[p.user_id] = p; });
      }

      const employeeMap: Record<string, any> = {};
      employees?.forEach(e => {
        employeeMap[e.id] = {
          employee_id: e.employee_id,
          profile: e.user_id ? profiles[e.user_id] || null : null,
        };
      });

      return data?.map(r => ({
        ...r,
        employee: employeeMap[r.employee_id] || null,
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

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      comments,
      approved_by 
    }: { 
      id: string; 
      status: "approved" | "rejected";
      comments?: string;
      approved_by?: string;
    }) => {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status,
          comments,
          approved_by,
          approved_on: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast.success(`Leave request ${variables.status} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update leave request: ${error.message}`);
    },
  });
}
