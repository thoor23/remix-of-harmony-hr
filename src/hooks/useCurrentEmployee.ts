import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCurrentEmployee() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-employee", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Fetch profile
      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        return { ...data, profile };
      }

      return null;
    },
    enabled: !!user?.id,
  });
}

export function useLeaveBalances(employeeId: string) {
  return useQuery({
    queryKey: ["leave-balances", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_type:leave_types(id, name, code, color)
        `)
        .eq("employee_id", employeeId)
        .eq("year", new Date().getFullYear());

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
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
