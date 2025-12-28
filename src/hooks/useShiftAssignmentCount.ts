import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useShiftAssignmentCount() {
  return useQuery({
    queryKey: ["shift-assignment-count"],
    queryFn: async () => {
      const assignments = await api.get<any[]>('/shifts/assignments');
      // Count only active assignments
      const activeCount = assignments.filter(a => a.is_active).length;
      return activeCount;
    },
  });
}
