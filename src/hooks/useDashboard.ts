import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  todayAttendance: number;
  attendancePercentage: number;
  newJoinersThisMonth: number;
  openTickets: number;
  departmentWiseCount: { department: string; count: number }[];
}

export interface AttendanceTrendItem {
  date: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  module: string;
  description: string;
  performer_name: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface ClockInItem {
  id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  date: string;
  employee: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    employee_id: string;
  } | null;
}

export interface UpcomingEvent {
  type: 'birthday' | 'holiday';
  name: string;
  date: string;
  description?: string;
  avatar_url?: string;
}

export interface LeaveBreakdownItem {
  name: string;
  value: number;
  days: number;
  color: string;
}

export interface PayrollSummary {
  thisMonth: number;
  lastMonth: number;
  change: number;
  payslipsGenerated: number;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

export function useAttendanceTrend(days = 7) {
  return useQuery({
    queryKey: ["attendance-trend", days],
    queryFn: () => api.get<AttendanceTrendItem[]>(`/dashboard/attendance-trend?days=${days}`),
    refetchInterval: 60000,
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: () => api.get<ActivityItem[]>(`/dashboard/recent-activity?limit=${limit}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useLiveClockIns(limit = 10) {
  return useQuery({
    queryKey: ["live-clockins", limit],
    queryFn: () => api.get<ClockInItem[]>(`/dashboard/live-clockins?limit=${limit}`),
    refetchInterval: 15000, // Refresh every 15 seconds for real-time feel
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: () => api.get<UpcomingEvent[]>('/dashboard/upcoming-events'),
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useLeaveBreakdown() {
  return useQuery({
    queryKey: ["leave-breakdown"],
    queryFn: () => api.get<LeaveBreakdownItem[]>('/dashboard/leave-breakdown'),
    refetchInterval: 60000,
  });
}

export function usePayrollSummary() {
  return useQuery({
    queryKey: ["payroll-summary"],
    queryFn: () => api.get<PayrollSummary>('/dashboard/payroll-summary'),
    refetchInterval: 60000,
  });
}

export function usePendingLeaveRequests(limit = 4) {
  return useQuery({
    queryKey: ["pending-leave-requests", limit],
    queryFn: () => api.get<any[]>(`/leaves/requests/pending?limit=${limit}`),
  });
}

export function useRecentAnnouncements(limit = 3) {
  return useQuery({
    queryKey: ["recent-announcements", limit],
    queryFn: () => api.get<any[]>(`/announcements/recent?limit=${limit}`),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<any[]>('/departments'),
  });
}
