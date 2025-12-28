import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper to fetch profiles and merge into requests
async function mergeProfilesIntoRequests(supabase: any, requests: any[]) {
  if (!requests || requests.length === 0) return requests;

  // Collect all user IDs
  const userIds: string[] = [];
  requests.forEach((r: any) => {
    if (r?.employee?.user_id) userIds.push(r.employee.user_id);
    if (r?.reviewer?.user_id) userIds.push(r.reviewer.user_id);
  });

  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return requests;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email, avatar_url')
    .in('user_id', uniqueUserIds);

  if (profilesError) throw profilesError;

  const profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return requests.map((r: any) => {
    const employeeUserId = r?.employee?.user_id;
    const reviewerUserId = r?.reviewer?.user_id;
    return {
      ...r,
      employee: r.employee
        ? { ...r.employee, profile: employeeUserId ? profilesMap[employeeUserId] || null : null }
        : null,
      reviewer: r.reviewer
        ? { ...r.reviewer, profile: reviewerUserId ? profilesMap[reviewerUserId] || null : null }
        : null,
    };
  });
}

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
          employee:employees!profile_change_requests_employee_id_fkey(id, employee_id, user_id),
          reviewer:employees!profile_change_requests_reviewed_by_fkey(id, employee_id, user_id)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const result = await mergeProfilesIntoRequests(supabase, data || []);
      return jsonResponse(result);
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
          employee:employees!profile_change_requests_employee_id_fkey(id, employee_id, user_id),
          reviewer:employees!profile_change_requests_reviewed_by_fkey(id, employee_id, user_id)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const result = await mergeProfilesIntoRequests(supabase, data || []);
      return jsonResponse(result);
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
        .insert({
          employee_id: employeeId,
          field_name: body.field_name,
          current_value: body.current_value,
          new_value: body.new_value,
          reason: body.reason,
          status: 'pending',
        })
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

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-profile-requests] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
