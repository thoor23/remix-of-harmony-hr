import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-dashboard', '');
  const method = req.method;

  try {
    const auth = await authenticateRequest(req);
    if (!auth) return errorResponse('Unauthorized', 401);

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET /stats - Admin dashboard stats
    if (method === 'GET' && path === '/stats') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const today = new Date().toISOString().split('T')[0];
      
      const [employees, pendingLeaves, todayAttendance, departments] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('leave_requests').select('*', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('attendance_records').select('*').eq('date', today),
        supabase.from('departments').select('id, name, employee_count'),
      ]);

      return jsonResponse({
        totalEmployees: employees.count || 0,
        activeEmployees: employees.count || 0,
        pendingLeaves: pendingLeaves.count || 0,
        presentToday: todayAttendance.data?.filter(a => a.status === 'present').length || 0,
        departments: departments.data || [],
      });
    }

    // GET /employee-stats - Employee personal stats
    if (method === 'GET' && path === '/employee-stats') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .single();

      if (!employee) return jsonResponse({});

      const year = new Date().getFullYear();
      const month = new Date().toISOString().slice(0, 7);

      const [leaveBalance, pendingLeaves, attendance] = await Promise.all([
        supabase.from('leave_balances').select('*, leave_type:leave_types(*)').eq('employee_id', employee.id).eq('year', year),
        supabase.from('leave_requests').select('*', { count: 'exact' }).eq('employee_id', employee.id).eq('status', 'pending'),
        supabase.from('attendance_records').select('*').eq('employee_id', employee.id).gte('date', `${month}-01`),
      ]);

      return jsonResponse({
        leaveBalance: leaveBalance.data || [],
        pendingLeaves: pendingLeaves.count || 0,
        attendanceThisMonth: attendance.data?.length || 0,
        workHoursThisMonth: attendance.data?.reduce((sum, a) => sum + (a.work_hours || 0), 0) || 0,
      });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-dashboard] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
