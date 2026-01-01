import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePendingLeaveCount(employeeId: string) {
  return useQuery({
    queryKey: ["pending-leave-count", employeeId],
    queryFn: async () => {
      if (!employeeId) return 0;
      
      const { count, error } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId)
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!employeeId,
  });
}
