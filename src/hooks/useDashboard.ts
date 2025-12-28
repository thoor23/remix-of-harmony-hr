import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const data = await api.get<{
        totalEmployees: number;
        activeEmployees: number;
        pendingLeaveRequests: number;
        todayAttendance: number;
        attendancePercentage: number;
        newJoinersThisMonth: number;
        departmentWiseCount: { department: string; count: number }[];
      }>('/dashboard/stats');
      
      return data;
    },
  });
}

export function usePendingLeaveRequests(limit = 4) {
  return useQuery({
    queryKey: ["pending-leave-requests", limit],
    queryFn: async () => {
      const data = await api.get<any[]>(`/leaves/requests/pending?limit=${limit}`);
      return data;
    },
  });
}

export function useRecentAnnouncements(limit = 3) {
  return useQuery({
    queryKey: ["recent-announcements", limit],
    queryFn: async () => {
      const data = await api.get<any[]>(`/announcements/recent?limit=${limit}`);
      return data;
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<any[]>('/departments'),
  });
}
