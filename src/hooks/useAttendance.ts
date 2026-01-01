import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export function useAttendanceRecords(month?: string) {
  return useQuery({
    queryKey: ["attendance-records", month],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (month) {
        const startDate = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
          .toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useTodayAttendanceStats() {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["attendance-stats", today],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('company_id', companyId)
        .eq('date', today);

      if (error) throw error;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (month) {
        const startDate = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
          .toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useTodayAttendance() {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["today-attendance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) return null;

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      // Check if already checked in today
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        throw new Error('Already checked in today');
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          employee_id: employeeId,
          company_id: companyId,
          date: today,
          check_in: now,
          status: 'present',
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
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
      const now = new Date().toISOString();

      // Find today's record
      const { data: existing, error: findError } = await supabase
        .from('attendance_records')
        .select('id, check_in')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (findError) throw findError;
      if (!existing) throw new Error('No check-in record found for today');
      if (!existing.check_in) throw new Error('Must check in first');

      // Calculate work hours
      const checkInTime = new Date(existing.check_in);
      const checkOutTime = new Date(now);
      const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out: now,
          work_hours: Math.round(workHours * 100) / 100,
        })
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      toast.success("Checked out successfully");
    },
    onError: (error: Error) => {
      toast.error(`Check-out failed: ${error.message}`);
    },
  });
}
