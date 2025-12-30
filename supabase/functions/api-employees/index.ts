import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, checkPermission, hashPassword } from '../_shared/auth.ts';
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
    
    // Permission check helper
    const hasPermission = async (action: 'create' | 'read' | 'update' | 'delete') => {
      return isAdminOrHR || await checkPermission(auth.userId, 'Employees', action);
    };

    // GET /list - List basic employee info (accessible by all authenticated users)
    // Returns limited fields for privacy - used for shift exchange, etc.
    if (method === 'GET' && path === '/list') {
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          avatar_url,
          status,
          department:departments(id, name, code)
        `)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return jsonResponse(employees);
    }

    // GET / - List all employees (requires read permission)
    if (method === 'GET' && path === '') {
      if (!await hasPermission('read')) {
        return errorResponse('Permission denied: read Employees', 403);
      }

      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return jsonResponse(employees);
    }

    // GET /current - Get current user's employee record
    if (method === 'GET' && path === '/current') {
      const { data: employee, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (error) throw error;

      return jsonResponse(employee);
    }

    // GET /role/:userId - Get employee role by user ID
    const roleMatch = path.match(/^\/role\/([a-f0-9-]+)$/);
    if (method === 'GET' && roleMatch) {
      const userId = roleMatch[1];
      
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role, role_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      return jsonResponse({ 
        role: userRole?.role || 'employee',
        role_id: userRole?.role_id || null
      });
    }

    // GET /:id - Get specific employee
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data: employee, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!employee) {
        return errorResponse('Employee not found', 404);
      }

      return jsonResponse(employee);
    }

    // POST / - Create employee
    if (method === 'POST' && path === '') {
      if (!await hasPermission('create')) {
        return errorResponse('Permission denied: create Employees', 403);
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
      if (!await hasPermission('create')) {
        return errorResponse('Permission denied: create Employees', 403);
      }

      const { email, password, firstName, lastName, phone, role = 'employee', ...employeeData } = await req.json();

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

      // Create role
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role,
      });

      // Create employee with profile fields merged
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
        })
        .select()
        .single();

      if (empError) throw empError;

      return jsonResponse({ user, employee }, 201);
    }

    // PUT /:id - Update employee
    if (method === 'PUT' && idMatch) {
      if (!await hasPermission('update')) {
        return errorResponse('Permission denied: update Employees', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      // Account/role fields (NOT columns on employees)
      const { role, role_id, password, user_id, ...rest } = body;

      // Remove fields that don't belong to employees table
      const employeeData = rest;

      // 1) Update employee table
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 2) If this request is also updating account settings, update related tables
      if (user_id) {
        // Update profile fields if present in payload
        const profileUpdate: Record<string, unknown> = {};
        if (typeof body.first_name === 'string') profileUpdate.first_name = body.first_name;
        if (typeof body.last_name === 'string') profileUpdate.last_name = body.last_name;
        if (typeof body.email === 'string') profileUpdate.email = body.email;
        if (typeof body.phone === 'string') profileUpdate.phone = body.phone;

        if (Object.keys(profileUpdate).length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', user_id);
          if (profileError) throw profileError;
        }

        // Update users email/is_active/password_hash if needed
        if (typeof body.email === 'string') {
          await supabase
            .from('users')
            .update({ email: body.email.toLowerCase() })
            .eq('id', user_id);
        }

        if (typeof body.status === 'string') {
          const isActive = body.status === 'active';
          await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', user_id);
        }

        if (typeof password === 'string' && password.length >= 6) {
          const passwordHash = await hashPassword(password);
          const { error: pwError } = await supabase
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', user_id);
          if (pwError) throw pwError;
        }

        // Update user_roles with role_type + role_id (UUID)
        if (role || role_id) {
          const updateObj: Record<string, unknown> = {};
          if (role) updateObj.role = role;
          if (role_id) updateObj.role_id = role_id;

          // Ensure row exists, then update
          const { data: existing } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', user_id)
            .maybeSingle();

          if (existing) {
            const { error: rErr } = await supabase
              .from('user_roles')
              .update(updateObj)
              .eq('user_id', user_id);
            if (rErr) throw rErr;
          } else {
            const { error: rErr } = await supabase
              .from('user_roles')
              .insert({ user_id, ...updateObj });
            if (rErr) throw rErr;
          }
        }
      }

      return jsonResponse(data);
    }

    // DELETE /:id - Delete employee
    if (method === 'DELETE' && idMatch) {
      if (!await hasPermission('delete')) {
        return errorResponse('Permission denied: delete Employees', 403);
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

    // PUT /current - Update current user's employee profile
    if (method === 'PUT' && path === '/current') {
      const body = await req.json();
      
      // Get current employee
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .single();

      if (!currentEmployee) {
        return errorResponse('Employee record not found', 404);
      }

      // Only allow updating specific fields for own profile
      const allowedFields = ['first_name', 'last_name', 'phone', 'address_street', 'address_city', 'address_state', 'address_zip_code', 'avatar_url'];
      const updateData: Record<string, unknown> = {};
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', currentEmployee.id)
        .select()
        .single();

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
