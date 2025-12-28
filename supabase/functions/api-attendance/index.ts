import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-attendance', '');
  const method = req.method;

  console.log(`[api-attendance] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // Helper to get employee ID for current user
    async function getEmployeeId(): Promise<string | null> {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth!.userId)
        .single();
      return data?.id || null;
    }

    // GET / - Get all attendance (admin/hr only)
    if (method === 'GET' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const month = url.searchParams.get('month');
      
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .order('date', { ascending: false });

      if (month) {
        const [year, m] = month.split('-');
        query = query.gte('date', `${year}-${m}-01`).lte('date', `${year}-${m}-31`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately and merge
      const userIds = [...new Set(data?.map((r: any) => r.employee?.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        
        profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }

      // Merge profile data into employee
      const result = data?.map((record: any) => ({
        ...record,
        employee: record.employee ? {
          ...record.employee,
          profile: profilesMap[record.employee.user_id] || null
        } : null
      }));

      return jsonResponse(result);
    }

    // GET /today - Get today's attendance for current user
    if (method === 'GET' && path === '/today') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return jsonResponse(null);
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return jsonResponse(data);
    }

    // GET /today/stats - Get today's attendance stats (admin/hr only)
    if (method === 'GET' && path === '/today/stats') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const today = new Date().toISOString().split('T')[0];

      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('date', today);

      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const stats = {
        present: attendance?.filter(a => a.status === 'present').length || 0,
        late: attendance?.filter(a => a.status === 'late').length || 0,
        absent: (totalEmployees || 0) - (attendance?.length || 0),
        on_leave: attendance?.filter(a => a.status === 'on_leave').length || 0,
        total: totalEmployees || 0,
      };

      return jsonResponse(stats);
    }

    // GET /my - Get current user's attendance
    if (method === 'GET' && path === '/my') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return jsonResponse([]);
      }

      const month = url.searchParams.get('month');
      
      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (month) {
        const [year, m] = month.split('-');
        query = query.gte('date', `${year}-${m}-01`).lte('date', `${year}-${m}-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /check-in - Clock in
    if (method === 'POST' && path === '/check-in') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return errorResponse('Employee record not found', 404);
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().slice(0, 8);

      // Check if already checked in
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (existing) {
        return errorResponse('Already checked in today', 400);
      }

      // Determine status (late if after 9:30 AM)
      const status = now > '09:30:00' ? 'late' : 'present';

      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employeeId,
          date: today,
          check_in: now,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // POST /check-out - Clock out
    if (method === 'POST' && path === '/check-out') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return errorResponse('Employee record not found', 404);
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().slice(0, 8);

      // Get today's record
      const { data: record } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (!record) {
        return errorResponse('No check-in record found for today', 400);
      }

      if (record.check_out) {
        return errorResponse('Already checked out today', 400);
      }

      // Calculate work hours
      const checkIn = new Date(`${today}T${record.check_in}`);
      const checkOut = new Date(`${today}T${now}`);
      const workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          check_out: now,
          work_hours: Math.round(workHours * 100) / 100,
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create attendance record (admin/hr only)
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('attendance_records')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /:id - Update attendance record (admin/hr only)
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('attendance_records')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /employee/:id - Get specific employee's attendance
    const employeeMatch = path.match(/^\/employee\/([a-f0-9-]+)$/);
    if (method === 'GET' && employeeMatch) {
      const id = employeeMatch[1];
      const month = url.searchParams.get('month');

      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', id)
        .order('date', { ascending: false });

      if (month) {
        const [year, m] = month.split('-');
        query = query.gte('date', `${year}-${m}-01`).lte('date', `${year}-${m}-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-attendance] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
