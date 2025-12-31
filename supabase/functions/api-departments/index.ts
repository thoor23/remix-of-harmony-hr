import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, getRequestCompanyId, withCompanyId } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-departments', '');
  const method = req.method;

  console.log(`[api-departments] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const companyId = getRequestCompanyId(url, auth);
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET / - Get all departments
    if (method === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      // Get employee counts for this company
      const { data: counts } = await supabase
        .from('employees')
        .select('department_id')
        .eq('company_id', companyId)
        .eq('status', 'active');

      const countMap = counts?.reduce((acc, emp) => {
        if (emp.department_id) {
          acc[emp.department_id] = (acc[emp.department_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const result = data?.map(dept => ({
        ...dept,
        employee_count: countMap[dept.id] || 0,
      }));

      return jsonResponse(result);
    }

    // GET /:id - Get specific department
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create department
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();

      // Check for duplicate code in this company
      const { data: existing } = await supabase
        .from('departments')
        .select('id')
        .eq('code', body.code)
        .eq('company_id', companyId)
        .single();

      if (existing) {
        return errorResponse('Department code already exists', 409);
      }

      const { data, error } = await supabase
        .from('departments')
        .insert(withCompanyId(body, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /:id - Update department
    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      // Check for duplicate code if changing
      if (body.code) {
        const { data: existing } = await supabase
          .from('departments')
          .select('id')
          .eq('code', body.code)
          .eq('company_id', companyId)
          .neq('id', id)
          .single();

        if (existing) {
          return errorResponse('Department code already exists', 409);
        }
      }

      const { data, error } = await supabase
        .from('departments')
        .update(body)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete department
    if (method === 'DELETE' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];

      // Check for employees
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', id)
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (count && count > 0) {
        return errorResponse('Cannot delete department with active employees', 400);
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-departments] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
