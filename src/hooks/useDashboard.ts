import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";
import { format, startOfMonth, subDays } from "date-fns";

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  todayAttendance: number;
  attendancePercentage: number;
  onLeaveToday: number;
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

export interface BirthdayEmployee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  date_of_birth: string;
  department_name: string | null;
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
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      
      // Fetch employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, status, date_of_joining, department_id, departments(name)')
        .eq('company_id', companyId);
      
      // Fetch today's attendance
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('company_id', companyId)
        .eq('date', today);
      
      // Fetch pending leaves
      const { data: pendingLeaves } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'pending');
      
      // Fetch today's approved leaves
      const { data: todayLeaves } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);
      
      // Fetch open tickets
      const { data: openTickets } = await supabase
        .from('helpdesk_tickets')
        .select('id')
        .eq('company_id', companyId)
        .in('status', ['open', 'in_progress']);
      
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;
      const newJoiners = employees?.filter(e => e.date_of_joining >= monthStart).length || 0;
      
      // Department counts
      const deptCounts: Record<string, number> = {};
      employees?.forEach(e => {
        const deptName = (e.departments as any)?.name || 'Unassigned';
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });
      
      return {
        totalEmployees,
        activeEmployees,
        pendingLeaveRequests: pendingLeaves?.length || 0,
        todayAttendance: attendance?.length || 0,
        attendancePercentage: activeEmployees > 0 ? Math.round((attendance?.length || 0) / activeEmployees * 100) : 0,
        onLeaveToday: todayLeaves?.length || 0,
        newJoinersThisMonth: newJoiners,
        openTickets: openTickets?.length || 0,
        departmentWiseCount: Object.entries(deptCounts).map(([department, count]) => ({ department, count })),
      } as DashboardStats;
    },
    refetchInterval: 60000,
  });
}

export function useAttendanceTrend(days = 7) {
  return useQuery({
    queryKey: ["attendance-trend", days],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      const { data } = await supabase
        .from('attendance_records')
        .select('date, status')
        .eq('company_id', companyId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));
      
      // Group by date
      const grouped: Record<string, { present: number; absent: number; late: number; leave: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
        grouped[date] = { present: 0, absent: 0, late: 0, leave: 0 };
      }
      
      data?.forEach(r => {
        if (grouped[r.date]) {
          if (r.status === 'present') grouped[r.date].present++;
          else if (r.status === 'absent') grouped[r.date].absent++;
          else if (r.status === 'late') grouped[r.date].late++;
          else if (r.status === 'leave') grouped[r.date].leave++;
        }
      });
      
      return Object.entries(grouped).map(([date, stats]) => ({
        date,
        name: format(new Date(date), 'EEE'),
        ...stats,
        total: stats.present + stats.absent + stats.late + stats.leave,
      })) as AttendanceTrendItem[];
    },
    refetchInterval: 60000,
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, module, description, performer_name, created_at, metadata')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return (data || []) as ActivityItem[];
    },
    refetchInterval: 30000,
  });
}

export function useLiveClockIns(limit = 10) {
  return useQuery({
    queryKey: ["live-clockins", limit],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id, check_in, check_out, status, date,
          employee:employees(id, first_name, last_name, avatar_url, employee_id)
        `)
        .eq('company_id', companyId)
        .eq('date', today)
        .order('check_in', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return (data || []) as unknown as ClockInItem[];
    },
    refetchInterval: 15000,
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextMonth = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const { data: holidays } = await supabase
        .from('holidays')
        .select('name, date, description')
        .eq('company_id', companyId)
        .gte('date', today)
        .lte('date', nextMonth)
        .order('date');
      
      return (holidays || []).map(h => ({
        type: 'holiday' as const,
        name: h.name,
        date: h.date,
        description: h.description,
      })) as UpcomingEvent[];
    },
    refetchInterval: 300000,
  });
}

export function useUpcomingBirthdays(month: number) {
  return useQuery({
    queryKey: ["upcoming-birthdays", month],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, avatar_url, date_of_birth, departments(name)')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .not('date_of_birth', 'is', null);
      
      if (error) throw error;
      
      // Filter by month
      const filtered = (data || []).filter(e => {
        if (!e.date_of_birth) return false;
        const dob = new Date(e.date_of_birth);
        return dob.getMonth() + 1 === month;
      });
      
      return filtered.map(e => ({
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        avatar_url: e.avatar_url,
        date_of_birth: e.date_of_birth!,
        department_name: (e.departments as any)?.name || null,
      })) as BirthdayEmployee[];
    },
    refetchInterval: 300000,
  });
}

export function useLeaveBreakdown() {
  return useQuery({
    queryKey: ["leave-breakdown"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      const year = new Date().getFullYear();
      
      const { data } = await supabase
        .from('leave_requests')
        .select('leave_type_id, days, leave_types(name)')
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .gte('start_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`);
      
      const breakdown: Record<string, { days: number; count: number }> = {};
      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      
      data?.forEach(l => {
        const typeName = (l.leave_types as any)?.name || 'Other';
        if (!breakdown[typeName]) {
          breakdown[typeName] = { days: 0, count: 0 };
        }
        breakdown[typeName].days += l.days || 0;
        breakdown[typeName].count++;
      });
      
      return Object.entries(breakdown).map(([name, stats], i) => ({
        name,
        value: stats.count,
        days: stats.days,
        color: colors[i % colors.length],
      })) as LeaveBreakdownItem[];
    },
    refetchInterval: 60000,
  });
}

export function usePayrollSummary() {
  return useQuery({
    queryKey: ["payroll-summary"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      const thisMonth = format(new Date(), 'yyyy-MM');
      const lastMonth = format(subDays(startOfMonth(new Date()), 1), 'yyyy-MM');
      
      const { data } = await supabase
        .from('payslips')
        .select('pay_period, net_pay')
        .eq('company_id', companyId)
        .in('pay_period', [thisMonth, lastMonth]);
      
      const thisMonthTotal = data?.filter(p => p.pay_period === thisMonth).reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
      const lastMonthTotal = data?.filter(p => p.pay_period === lastMonth).reduce((sum, p) => sum + (p.net_pay || 0), 0) || 0;
      const payslipsGenerated = data?.filter(p => p.pay_period === thisMonth).length || 0;
      
      return {
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        change: lastMonthTotal > 0 ? Math.round((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0,
        payslipsGenerated,
      } as PayrollSummary;
    },
    refetchInterval: 60000,
  });
}

export function usePendingLeaveRequests(limit = 4) {
  return useQuery({
    queryKey: ["pending-leave-requests", limit],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name, avatar_url, employee_id),
          leave_type:leave_types(name, code)
        `)
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentAnnouncements(limit = 3) {
  return useQuery({
    queryKey: ["recent-announcements", limit],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
}
