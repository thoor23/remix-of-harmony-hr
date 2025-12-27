import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAttendanceRecords(month?: string) {
  return useQuery({
    queryKey: ["attendance-records", month],
    queryFn: async () => {
      let query = supabase
        .from("attendance_records")
        .select(`
          *,
          employee:employees(
            id,
            employee_id,
            user_id,
            department:departments(id, name),
            designation:designations(id, name)
          )
        `)
        .order("date", { ascending: false });

      if (month) {
        const [year, monthNum] = month.split("-");
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];
        query = query.gte("date", startDate).lte("date", endDate);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      // Fetch profiles for employees
      const userIds = data?.map(r => r.employee?.user_id).filter(Boolean) || [];
      let profiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(record => ({
        ...record,
        employee: record.employee ? {
          ...record.employee,
          profile: record.employee.user_id ? profiles[record.employee.user_id] : null
        } : null
      }));
    },
  });
}

export function useTodayAttendanceStats() {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["attendance-stats", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("date", today);

      if (error) throw error;

      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
      };

      data?.forEach(record => {
        switch (record.status) {
          case "present": stats.present++; break;
          case "absent": stats.absent++; break;
          case "late": stats.late++; break;
          case "on-leave": stats.onLeave++; break;
        }
      });

      return stats;
    },
  });
}

export function useMyAttendance(employeeId: string, month?: string) {
  return useQuery({
    queryKey: ["my-attendance", employeeId, month],
    queryFn: async () => {
      let query = supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date", { ascending: false });

      if (month) {
        const [year, monthNum] = month.split("-");
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];
        query = query.gte("date", startDate).lte("date", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().split(" ")[0].substring(0, 5);

      const { error } = await supabase
        .from("attendance_records")
        .upsert({
          employee_id: employeeId,
          date: today,
          check_in: now,
          status: "present",
        }, { onConflict: "employee_id,date" });

      if (error) throw error;
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
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().split(" ")[0].substring(0, 5);

      // Get check-in time to calculate work hours
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("check_in")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .single();

      let workHours = null;
      if (existing?.check_in) {
        const checkIn = new Date(`${today}T${existing.check_in}`);
        const checkOut = new Date(`${today}T${now}`);
        workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }

      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out: now,
          work_hours: workHours ? Math.round(workHours * 10) / 10 : null,
        })
        .eq("employee_id", employeeId)
        .eq("date", today);

      if (error) throw error;
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
