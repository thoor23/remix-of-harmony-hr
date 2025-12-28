import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePendingLeaveCount(employeeId: string) {
  return useQuery({
    queryKey: ["pending-leave-count", employeeId],
    queryFn: async () => {
      if (!employeeId) return 0;
      const requests = await api.get<any[]>('/leaves/my');
      const pendingCount = requests.filter(r => r.status === 'pending').length;
      return pendingCount;
    },
    enabled: !!employeeId,
  });
}
