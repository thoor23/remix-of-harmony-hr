import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentEmployee() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-employee", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          designation:designations(*),
          primary_store:stores!employees_primary_store_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current employee:', error);
        throw error;
      }

      // Add profile-like structure for backwards compatibility
      if (data) {
        return {
          ...data,
          profile: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            avatar_url: data.avatar_url,
          }
        };
      }

      return data;
    },
    enabled: !!user?.id,
  });
}

export function useLeaveBalances(employeeId?: string) {
  return useQuery({
    queryKey: ["leave-balances", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          leave_type:leave_types(*)
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}
