import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-leaves', '');
  const method = req.method;

  console.log(`[api-leaves] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    async function getEmployeeId(): Promise<string | null> {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth!.userId)
        .single();
      return data?.id || null;
    }

    // GET /types - Get all leave types
    if (method === 'GET' && path === '/types') {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /balances - Get current user's leave balances
    if (method === 'GET' && path === '/balances') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return jsonResponse([]);
      }

      const year = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*, leave_type:leave_types(*)')
        .eq('employee_id', employeeId)
        .eq('year', year);

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /my - Get current user's leave requests
    if (method === 'GET' && path === '/my') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return jsonResponse([]);
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, leave_type:leave_types(*)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /requests/pending - Get pending leave requests (for dashboard)
    if (method === 'GET' && path === '/requests/pending') {
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const { data: leaveRequests, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(*),
          employee:employees!leave_requests_employee_id_fkey(
            id,
            employee_id,
            user_id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return jsonResponse(leaveRequests || []);
    }

    // GET / or /requests - Get all leave requests (admin/hr only)
    if (method === 'GET' && (path === '' || path === '/requests')) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const status = url.searchParams.get('status');

      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(*),
          employee:employees!leave_requests_employee_id_fkey(
            id,
            employee_id,
            user_id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: leaveRequests, error } = await query;
      if (error) throw error;

      return jsonResponse(leaveRequests || []);
    }

    // POST / - Create leave request
    if (method === 'POST' && path === '') {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return errorResponse('Employee record not found', 404);
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          ...body,
          employee_id: employeeId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update pending days in leave balance
      const year = new Date().getFullYear();
      await supabase
        .from('leave_balances')
        .update({ pending_days: supabase.rpc('increment_pending', { days: body.days }) })
        .eq('employee_id', employeeId)
        .eq('leave_type_id', body.leave_type_id)
        .eq('year', year);

      return jsonResponse(data, 201);
    }

    // PUT /:id - Update leave request (approve/reject)
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'PUT' && idMatch) {
      const id = idMatch[1];
      const body = await req.json();

      // Get original request
      const { data: originalRequest } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!originalRequest) {
        return errorResponse('Leave request not found', 404);
      }

      // Only admin/hr can approve/reject
      if (body.status && body.status !== 'pending' && !isAdminOrHR) {
        return errorResponse('Admin or HR access required to approve/reject', 403);
      }

      const updateData: Record<string, unknown> = { ...body };
      
      if (body.status === 'approved') {
        updateData.approved_by = await getEmployeeId();
        updateData.approved_on = new Date().toISOString();

        // Update leave balance
        const year = new Date().getFullYear();
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('employee_id', originalRequest.employee_id)
          .eq('leave_type_id', originalRequest.leave_type_id)
          .eq('year', year)
          .single();

        if (balance) {
          await supabase
            .from('leave_balances')
            .update({
              used_days: balance.used_days + originalRequest.days,
              pending_days: Math.max(0, balance.pending_days - originalRequest.days),
            })
            .eq('id', balance.id);
        }
      } else if (body.status === 'rejected') {
        // Reduce pending days
        const year = new Date().getFullYear();
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('employee_id', originalRequest.employee_id)
          .eq('leave_type_id', originalRequest.leave_type_id)
          .eq('year', year)
          .single();

        if (balance) {
          await supabase
            .from('leave_balances')
            .update({
              pending_days: Math.max(0, balance.pending_days - originalRequest.days),
            })
            .eq('id', balance.id);
        }
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Cancel leave request
    if (method === 'DELETE' && idMatch) {
      const id = idMatch[1];

      // Get request first
      const { data: request } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!request) {
        return errorResponse('Leave request not found', 404);
      }

      // Check ownership or admin/hr
      const employeeId = await getEmployeeId();
      if (request.employee_id !== employeeId && !isAdminOrHR) {
        return errorResponse('Not authorized', 403);
      }

      // Reduce pending days
      if (request.status === 'pending') {
        const year = new Date().getFullYear();
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('employee_id', request.employee_id)
          .eq('leave_type_id', request.leave_type_id)
          .eq('year', year)
          .single();

        if (balance) {
          await supabase
            .from('leave_balances')
            .update({
              pending_days: Math.max(0, balance.pending_days - request.days),
            })
            .eq('id', balance.id);
        }
      }

      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /requests/employee/:employeeId - Get specific employee's leave requests (admin/hr only)
    const employeeRequestsMatch = path.match(/^\/requests\/employee\/([a-f0-9-]+)$/);
    if (method === 'GET' && employeeRequestsMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const employeeId = employeeRequestsMatch[1];

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, leave_type:leave_types(*)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data || []);
    }

    // GET /balances/:employeeId - Get specific employee's balances (admin/hr only)
    const balanceMatch = path.match(/^\/balances\/([a-f0-9-]+)$/);
    if (method === 'GET' && balanceMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const employeeId = balanceMatch[1];
      const year = new Date().getFullYear();

      const { data, error } = await supabase
        .from('leave_balances')
        .select('*, leave_type:leave_types(*)')
        .eq('employee_id', employeeId)
        .eq('year', year);

      if (error) throw error;
      return jsonResponse(data || []);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-leaves] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
