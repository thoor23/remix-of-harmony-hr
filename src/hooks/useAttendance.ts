import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useAttendanceRecords(month?: string) {
  return useQuery({
    queryKey: ["attendance-records", month],
    queryFn: async () => {
      const params = month ? `?month=${month}` : '';
      return api.get<any[]>(`/attendance${params}`);
    },
  });
}

export function useTodayAttendanceStats() {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["attendance-stats", today],
    queryFn: async () => {
      const data = await api.get<any[]>(`/attendance/today/stats`);
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
      };
      
      if (Array.isArray(data)) {
        data.forEach((record: any) => {
          switch (record.status) {
            case "present": stats.present++; break;
            case "absent": stats.absent++; break;
            case "late": stats.late++; break;
            case "on-leave": stats.onLeave++; break;
          }
        });
      }
      
      return stats;
    },
  });
}

export function useMyAttendance(month?: string) {
  return useQuery({
    queryKey: ["my-attendance", month],
    queryFn: async () => {
      const params = month ? `?month=${month}` : '';
      return api.get<any[]>(`/attendance/my${params}`);
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      await api.post('/attendance/check-in', { employee_id: employeeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success("Checked in successfully");
    },
    onError: (error: Error) => {
      toast.error(`Check-in failed: ${error.message}`);
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      await api.post('/attendance/check-out', { employee_id: employeeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success("Checked out successfully");
    },
    onError: (error: Error) => {
      toast.error(`Check-out failed: ${error.message}`);
    },
  });
}
