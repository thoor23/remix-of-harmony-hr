import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-employees', '');
  const method = req.method;

  console.log(`[api-employees] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET / - List all employees
    if (method === 'GET' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code),
          profile:profiles!employees_user_id_fkey(first_name, last_name, email, phone, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /current - Get current user's employee record
    if (method === 'GET' && path === '/current') {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code),
          profile:profiles!employees_user_id_fkey(first_name, last_name, email, phone, avatar_url)
        `)
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:id - Get specific employee
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code),
          profile:profiles!employees_user_id_fkey(first_name, last_name, email, phone, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create employee
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('employees')
        .insert(body)
        .select()
        .single();

      if (error) throw error;

      // Update department employee count
      if (body.department_id) {
        await supabase.rpc('update_department_count', { dept_id: body.department_id });
      }

      return jsonResponse(data, 201);
    }

    // POST /create-account - Create employee with user account
    if (method === 'POST' && path === '/create-account') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { email, password, firstName, lastName, role = 'employee', ...employeeData } = await req.json();

      // Import auth functions
      const { hashPassword } = await import('../_shared/auth.ts');

      // Create user
      const passwordHash = await hashPassword(password);
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          is_active: true,
          email_confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create profile
      await supabase.from('profiles').insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
      });

      // Create role
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role,
      });

      // Create employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          user_id: user.id,
        })
        .select()
        .single();

      if (empError) throw empError;

      return jsonResponse({ user, employee }, 201);
    }

    // PUT /:id - Update employee
    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('employees')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete employee
    if (method === 'DELETE' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];

      // Get employee first to clean up related data
      const { data: employee } = await supabase
        .from('employees')
        .select('user_id, department_id')
        .eq('id', id)
        .single();

      if (employee?.user_id) {
        // Delete user and related data (cascades)
        await supabase.from('users').delete().eq('id', employee.user_id);
      }

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /:id/attendance - Get employee attendance
    const attendanceMatch = path.match(/^\/([a-f0-9-]+)\/attendance$/);
    if (method === 'GET' && attendanceMatch) {
      const id = attendanceMatch[1];
      const month = url.searchParams.get('month');

      let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', id)
        .order('date', { ascending: false });

      if (month) {
        const [year, m] = month.split('-');
        const startDate = `${year}-${m}-01`;
        const endDate = `${year}-${m}-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:id/leaves - Get employee leaves
    const leavesMatch = path.match(/^\/([a-f0-9-]+)\/leaves$/);
    if (method === 'GET' && leavesMatch) {
      const id = leavesMatch[1];

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, leave_type:leave_types(*)')
        .eq('employee_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-employees] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
