import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, getRequestCompanyId } from '../_shared/auth.ts';
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
    const companyId = getRequestCompanyId(url, auth);
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET /stats - Admin dashboard stats
    if (method === 'GET' && path === '/stats') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);
      const firstOfMonth = `${thisMonth}-01`;
      
      const [employees, pendingLeaves, todayAttendance, todayLeaves, departments, newJoiners, openTickets] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact' }).eq('company_id', companyId).eq('status', 'active'),
        supabase.from('leave_requests').select('*', { count: 'exact' }).eq('company_id', companyId).eq('status', 'pending'),
        supabase.from('attendance_records').select('*').eq('company_id', companyId).eq('date', today),
        supabase.from('leave_requests').select('*', { count: 'exact' }).eq('company_id', companyId).eq('status', 'approved').lte('start_date', today).gte('end_date', today),
        supabase.from('departments').select('id, name, employee_count').eq('company_id', companyId),
        supabase.from('employees').select('*', { count: 'exact' }).eq('company_id', companyId).gte('date_of_joining', firstOfMonth),
        supabase.from('helpdesk_tickets').select('*', { count: 'exact' }).eq('company_id', companyId).in('status', ['open', 'in_progress']),
      ]);

      const totalEmployees = employees.count || 0;
      const presentToday = todayAttendance.data?.filter(a => a.status === 'present').length || 0;
      const attendancePercentage = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

      const departmentWiseCount = departments.data?.map(d => ({
        department: d.name,
        count: d.employee_count || 0,
      })) || [];

      return jsonResponse({
        totalEmployees,
        activeEmployees: totalEmployees,
        pendingLeaveRequests: pendingLeaves.count || 0,
        todayAttendance: presentToday,
        attendancePercentage,
        onLeaveToday: todayLeaves.count || 0,
        newJoinersThisMonth: newJoiners.count || 0,
        openTickets: openTickets.count || 0,
        departmentWiseCount,
      });
    }

    // GET /attendance-trend - Last 7 days attendance trend
    if (method === 'GET' && path === '/attendance-trend') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const days = parseInt(url.searchParams.get('days') || '7');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);

      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('date, status')
        .eq('company_id', companyId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      const trendData: Record<string, { present: number; absent: number; late: number; leave: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        trendData[dateStr] = { present: 0, absent: 0, late: 0, leave: 0 };
      }

      attendance?.forEach(record => {
        if (trendData[record.date]) {
          const status = record.status as string;
          if (status === 'present') trendData[record.date].present++;
          else if (status === 'absent') trendData[record.date].absent++;
          else if (status === 'late') trendData[record.date].late++;
          else if (status === 'on_leave') trendData[record.date].leave++;
        }
      });

      const trend = Object.entries(trendData).map(([date, counts]) => ({
        date,
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        ...counts,
        total: totalEmployees || 0,
      }));

      return jsonResponse(trend);
    }

    // GET /recent-activity - Recent system activity
    if (method === 'GET' && path === '/recent-activity') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const limit = parseInt(url.searchParams.get('limit') || '10');

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return jsonResponse(auditLogs || []);
    }

    // GET /live-clockins - Today's clock-in feed
    if (method === 'GET' && path === '/live-clockins') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const today = new Date().toISOString().split('T')[0];
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const { data: clockins } = await supabase
        .from('attendance_records')
        .select(`
          id,
          check_in,
          check_out,
          status,
          date,
          employee:employees(id, first_name, last_name, avatar_url, employee_id)
        `)
        .eq('company_id', companyId)
        .eq('date', today)
        .order('check_in', { ascending: false })
        .limit(limit);

      return jsonResponse(clockins || []);
    }

    // GET /upcoming-events - Upcoming birthdays and holidays
    if (method === 'GET' && path === '/upcoming-events') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .eq('company_id', companyId)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', nextWeek.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, avatar_url, date_of_birth')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .not('date_of_birth', 'is', null);

      const upcomingBirthdays = employees?.filter(emp => {
        if (!emp.date_of_birth) return false;
        const dob = new Date(emp.date_of_birth);
        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      }).map(emp => ({
        type: 'birthday' as const,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        date: emp.date_of_birth,
        avatar_url: emp.avatar_url,
      })) || [];

      const events = [
        ...upcomingBirthdays,
        ...(holidays?.map(h => ({
          type: 'holiday' as const,
          name: h.name,
          date: h.date,
          description: h.description,
        })) || []),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return jsonResponse(events);
    }

    // GET /birthdays - Employee birthdays by month
    if (method === 'GET' && path === '/birthdays') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, avatar_url, date_of_birth, department:departments(name)')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .not('date_of_birth', 'is', null);

      const birthdaysInMonth = employees?.filter(emp => {
        if (!emp.date_of_birth) return false;
        const dob = new Date(emp.date_of_birth);
        return dob.getMonth() + 1 === month;
      }).map(emp => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        avatar_url: emp.avatar_url,
        date_of_birth: emp.date_of_birth,
        department_name: (emp.department as { name?: string } | null)?.name || null,
      })).sort((a, b) => {
        const dayA = new Date(a.date_of_birth).getDate();
        const dayB = new Date(b.date_of_birth).getDate();
        return dayA - dayB;
      }) || [];

      return jsonResponse(birthdaysInMonth);
    }

    // GET /leave-breakdown - Leave requests by type
    if (method === 'GET' && path === '/leave-breakdown') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const year = new Date().getFullYear();
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;

      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select(`
          id,
          days,
          status,
          leave_type:leave_types(name, color)
        `)
        .eq('company_id', companyId)
        .gte('start_date', startOfYear)
        .lte('start_date', endOfYear)
        .eq('status', 'approved');

      const breakdown: Record<string, { count: number; days: number; color: string }> = {};
      leaveRequests?.forEach(request => {
        const leaveType = request.leave_type as { name?: string; color?: string } | null;
        const typeName = leaveType?.name || 'Other';
        if (!breakdown[typeName]) {
          breakdown[typeName] = { count: 0, days: 0, color: leaveType?.color || '#3B82F6' };
        }
        breakdown[typeName].count++;
        breakdown[typeName].days += Number(request.days) || 0;
      });

      const result = Object.entries(breakdown).map(([name, data]) => ({
        name,
        value: data.count,
        days: data.days,
        color: data.color,
      }));

      return jsonResponse(result);
    }

    // GET /payroll-summary - This month's payroll summary
    if (method === 'GET' && path === '/payroll-summary') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);

      const thisMonth = new Date().toISOString().slice(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);

      const [thisMonthPayroll, lastMonthPayroll] = await Promise.all([
        supabase.from('payslips').select('gross_earnings, net_pay, total_deductions').eq('company_id', companyId).eq('pay_period', thisMonth),
        supabase.from('payslips').select('gross_earnings, net_pay, total_deductions').eq('company_id', companyId).eq('pay_period', lastMonthStr),
      ]);

      const thisMonthTotal = thisMonthPayroll.data?.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0) || 0;
      const lastMonthTotal = lastMonthPayroll.data?.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0) || 0;
      const change = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

      return jsonResponse({
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        change,
        payslipsGenerated: thisMonthPayroll.data?.length || 0,
      });
    }

    // GET /employee-stats - Employee personal stats
    if (method === 'GET' && path === '/employee-stats') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      if (!employee) return jsonResponse({});

      const year = new Date().getFullYear();
      const month = new Date().toISOString().slice(0, 7);

      const [leaveBalance, pendingLeaves, attendance] = await Promise.all([
        supabase.from('leave_balances').select('*, leave_type:leave_types(*)').eq('company_id', companyId).eq('employee_id', employee.id).eq('year', year),
        supabase.from('leave_requests').select('*', { count: 'exact' }).eq('company_id', companyId).eq('employee_id', employee.id).eq('status', 'pending'),
        supabase.from('attendance_records').select('*').eq('company_id', companyId).eq('employee_id', employee.id).gte('date', `${month}-01`),
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
