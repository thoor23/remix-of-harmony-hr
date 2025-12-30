import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useCurrentEmployee() {
  const { user, employeeId } = useAuth();

  return useQuery({
    queryKey: ["current-employee", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return api.get<any>('/employees/current');
    },
    enabled: !!user?.id,
  });
}

export function useLeaveBalances(employeeId?: string) {
  return useQuery({
    queryKey: ["leave-balances", employeeId],
    queryFn: () => api.get<any[]>(`/leaves/balances`),
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: () => api.get<any[]>('/leaves/types'),
  });
}
