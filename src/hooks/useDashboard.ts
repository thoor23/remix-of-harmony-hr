import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      // Get employee counts
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id, status, department_id, date_of_joining");

      if (empError) throw empError;

      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(e => e.status === "active").length || 0;

      // Get pending leave requests
      const { count: pendingLeaveRequests } = await supabase
        .from("leave_requests")
        .select("id", { count: "exact" })
        .eq("status", "pending");

      // Get today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("id, status")
        .eq("date", today);

      const todayAttendance = attendance?.filter(a => a.status === "present" || a.status === "late").length || 0;
      const attendancePercentage = totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0;

      // Get new joiners this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const newJoinersThisMonth = employees?.filter(e => 
        new Date(e.date_of_joining) >= startOfMonth
      ).length || 0;

      // Get department-wise count
      const { data: departments } = await supabase
        .from("departments")
        .select("id, name, employee_count");

      const departmentWiseCount = departments?.map(d => ({
        department: d.name,
        count: d.employee_count || 0,
      })) || [];

      return {
        totalEmployees,
        activeEmployees,
        pendingLeaveRequests: pendingLeaveRequests || 0,
        todayAttendance,
        attendancePercentage,
        newJoinersThisMonth,
        departmentWiseCount,
      };
    },
  });
}

export function usePendingLeaveRequests(limit = 4) {
  return useQuery({
    queryKey: ["pending-leave-requests", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          id,
          employee_id,
          start_date,
          end_date,
          days,
          reason,
          leave_type:leave_types(name, color)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch employee profiles
      const employeeIds = data?.map(r => r.employee_id) || [];
      const { data: employees } = await supabase
        .from("employees")
        .select("id, user_id")
        .in("id", employeeIds);

      const userIds = employees?.filter(e => e.user_id).map(e => e.user_id) || [];
      let profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds);
        profilesData?.forEach(p => { profiles[p.user_id] = p; });
      }

      const employeeMap: Record<string, any> = {};
      employees?.forEach(e => {
        employeeMap[e.id] = e.user_id ? profiles[e.user_id] || null : null;
      });

      return data?.map(r => ({
        ...r,
        employee_profile: employeeMap[r.employee_id] || null,
      }));
    },
  });
}

export function useRecentAnnouncements(limit = 3) {
  return useQuery({
    queryKey: ["recent-announcements", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, priority, type, published_at")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}
