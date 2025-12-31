import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, checkPermission, hashPassword, getRequestCompanyId, withCompanyId, DEFAULT_COMPANY_ID } from '../_shared/auth.ts';
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
    const companyId = getRequestCompanyId(url, auth);
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);
    
    // Permission check helper
    const hasPermission = async (action: 'create' | 'read' | 'update' | 'delete') => {
      return isAdminOrHR || await checkPermission(auth.userId, 'Employees', action);
    };

    // GET /list - List basic employee info (accessible by all authenticated users)
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
        .eq('company_id', companyId)
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
        .eq('company_id', companyId)
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
        .eq('company_id', companyId)
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
        .eq('company_id', companyId)
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
        .eq('company_id', companyId)
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
        .insert(withCompanyId(body, companyId))
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

      // Create user with company_id
      const passwordHash = await hashPassword(password);
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          is_active: true,
          email_confirmed_at: new Date().toISOString(),
          company_id: companyId,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create role with company_id
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role,
        company_id: companyId,
      });

      // Create employee with company_id
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
          ...employeeData,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          company_id: companyId,
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

      // Verify employee belongs to company
      const { data: existing } = await supabase
        .from('employees')
        .select('id, user_id')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (!existing) {
        return errorResponse('Employee not found', 404);
      }

      // Account/role fields (NOT columns on employees)
      const { role, role_id, password, user_id, company_id: _, ...rest } = body;

      // Remove fields that don't belong to employees table
      const employeeData = rest;

      // 1) Update employee table
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;

      // 2) If this request is also updating account settings, update related tables
      if (existing.user_id) {
        if (typeof body.email === 'string') {
          await supabase
            .from('users')
            .update({ email: body.email.toLowerCase() })
            .eq('id', existing.user_id);
        }

        if (typeof body.status === 'string') {
          const isActive = body.status === 'active';
          await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', existing.user_id);
        }

        if (typeof password === 'string' && password.length >= 6) {
          const passwordHash = await hashPassword(password);
          const { error: pwError } = await supabase
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', existing.user_id);
          if (pwError) throw pwError;
        }

        // Update user_roles
        if (role || role_id) {
          const updateObj: Record<string, unknown> = {};
          if (role) updateObj.role = role;
          if (role_id) updateObj.role_id = role_id;

          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', existing.user_id)
            .maybeSingle();

          if (existingRole) {
            const { error: rErr } = await supabase
              .from('user_roles')
              .update(updateObj)
              .eq('user_id', existing.user_id);
            if (rErr) throw rErr;
          } else {
            const { error: rErr } = await supabase
              .from('user_roles')
              .insert({ user_id: existing.user_id, company_id: companyId, ...updateObj });
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
        .eq('company_id', companyId)
        .single();

      if (!employee) {
        return errorResponse('Employee not found', 404);
      }

      if (employee.user_id) {
        await supabase.from('users').delete().eq('id', employee.user_id);
      }

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

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
        .eq('company_id', companyId)
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
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // PUT /current - Update current user's employee profile
    if (method === 'PUT' && path === '/current') {
      const body = await req.json();
      
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      if (!currentEmployee) {
        return errorResponse('Employee record not found', 404);
      }

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
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /bulk - Bulk create employees
    if (method === 'POST' && path === '/bulk') {
      if (!await hasPermission('create')) {
        return errorResponse('Permission denied: create Employees', 403);
      }

      const { employees: employeeList } = await req.json();
      
      if (!Array.isArray(employeeList) || employeeList.length === 0) {
        return errorResponse('employees array is required', 400);
      }

      if (employeeList.length > 100) {
        return errorResponse('Maximum 100 employees per bulk operation', 400);
      }

      const results = { success: [], failed: [] } as { success: unknown[], failed: { data: unknown, error: string }[] };

      for (const emp of employeeList) {
        try {
          const { data, error } = await supabase
            .from('employees')
            .insert(withCompanyId(emp, companyId))
            .select()
            .single();

          if (error) {
            results.failed.push({ data: emp, error: error.message });
          } else {
            results.success.push(data);
          }
        } catch (e) {
          results.failed.push({ data: emp, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return jsonResponse({
        total: employeeList.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        results,
      }, results.failed.length > 0 ? 207 : 201);
    }

    // PUT /bulk - Bulk update employees
    if (method === 'PUT' && path === '/bulk') {
      if (!await hasPermission('update')) {
        return errorResponse('Permission denied: update Employees', 403);
      }

      const { updates } = await req.json();
      
      if (!Array.isArray(updates) || updates.length === 0) {
        return errorResponse('updates array is required', 400);
      }

      if (updates.length > 100) {
        return errorResponse('Maximum 100 employees per bulk operation', 400);
      }

      const results = { success: [], failed: [] } as { success: unknown[], failed: { id: string, error: string }[] };

      for (const { id, ...updateData } of updates) {
        if (!id) {
          results.failed.push({ id: 'unknown', error: 'id is required for each update' });
          continue;
        }

        try {
          const { data, error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', id)
            .eq('company_id', companyId)
            .select()
            .single();

          if (error) {
            results.failed.push({ id, error: error.message });
          } else {
            results.success.push(data);
          }
        } catch (e) {
          results.failed.push({ id, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return jsonResponse({
        total: updates.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        results,
      }, results.failed.length > 0 ? 207 : 200);
    }

    // POST /import - Import employees from JSON/CSV
    if (method === 'POST' && path === '/import') {
      if (!await hasPermission('create')) {
        return errorResponse('Permission denied: create Employees', 403);
      }

      const body = await req.json();
      const { data: importData, format = 'json' } = body;

      if (!importData) {
        return errorResponse('data is required', 400);
      }

      let employees: unknown[] = [];

      if (format === 'json') {
        employees = Array.isArray(importData) ? importData : [importData];
      } else if (format === 'csv') {
        return errorResponse('CSV import not yet implemented', 400);
      }

      const results = { success: [], failed: [] } as { success: unknown[], failed: { data: unknown, error: string }[] };

      for (const emp of employees) {
        try {
          const { data, error } = await supabase
            .from('employees')
            .insert(withCompanyId(emp as Record<string, unknown>, companyId))
            .select()
            .single();

          if (error) {
            results.failed.push({ data: emp, error: error.message });
          } else {
            results.success.push(data);
          }
        } catch (e) {
          results.failed.push({ data: emp, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }

      return jsonResponse({
        total: employees.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        results,
      }, results.failed.length > 0 ? 207 : 201);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-employees] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
