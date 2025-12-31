import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest, getRequestCompanyId, withCompanyId } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const subPath = pathParts.slice(1);

  console.log(`[api-profile-requests] ${req.method} ${url.pathname}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const companyId = getRequestCompanyId(url, auth);
    const isAdminOrHR = auth.role === 'admin' || auth.role === 'hr';

    async function getEmployeeId(): Promise<string | null> {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth!.userId)
        .single();
      return data?.id || null;
    }

    // GET /my - Get current user's change requests
    if (req.method === 'GET' && subPath[0] === 'my') {
      const employeeId = await getEmployeeId();
      if (!employeeId) return jsonResponse([]);

      const { data, error } = await supabase
        .from('profile_change_requests')
        .select(`
          *,
          employee:employees!profile_change_requests_employee_id_fkey(id, employee_id, first_name, last_name, email, avatar_url),
          reviewer:employees!profile_change_requests_reviewed_by_fkey(id, employee_id, first_name, last_name, email, avatar_url)
        `)
        .eq('employee_id', employeeId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data || []);
    }

    // GET / - Get all change requests (admin/hr only)
    if (req.method === 'GET' && subPath.length === 0) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const status = url.searchParams.get('status');

      let query = supabase
        .from('profile_change_requests')
        .select(`
          *,
          employee:employees!profile_change_requests_employee_id_fkey(id, employee_id, first_name, last_name, email, avatar_url),
          reviewer:employees!profile_change_requests_reviewed_by_fkey(id, employee_id, first_name, last_name, email, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // POST / - Create a change request
    if (req.method === 'POST' && subPath.length === 0) {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return errorResponse('Employee not found', 404);
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('profile_change_requests')
        .insert(withCompanyId({
          employee_id: employeeId,
          field_name: body.field_name,
          current_value: body.current_value,
          new_value: body.new_value,
          reason: body.reason,
          status: 'pending',
        }, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PATCH /:id - Update a change request (approve/reject)
    const idMatch = subPath[0]?.match(/^[a-f0-9-]+$/);
    if (req.method === 'PATCH' && idMatch && subPath.length === 1) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = subPath[0];
      const body = await req.json();
      const reviewerId = await getEmployeeId();

      const updateData: any = {
        status: body.status,
        review_comments: body.review_comments,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profile_change_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete a change request (own pending requests only, or admin/hr)
    if (req.method === 'DELETE' && idMatch && subPath.length === 1) {
      const id = subPath[0];
      const employeeId = await getEmployeeId();

      // Check if the request belongs to the user and is pending
      const { data: existingRequest, error: fetchError } = await supabase
        .from('profile_change_requests')
        .select('employee_id, status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!existingRequest) {
        return errorResponse('Request not found', 404);
      }

      // Allow delete if admin/hr OR if it's their own pending request
      const canDelete = isAdminOrHR || (existingRequest.employee_id === employeeId && existingRequest.status === 'pending');
      
      if (!canDelete) {
        return errorResponse('You can only delete your own pending requests', 403);
      }

      const { error } = await supabase
        .from('profile_change_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-profile-requests] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
