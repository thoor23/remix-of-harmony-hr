import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper to fetch profiles and merge into assignments
async function mergeProfilesIntoAssignments(supabase: any, assignments: any[]) {
  if (!assignments || assignments.length === 0) return assignments;

  const userIds = assignments
    .map((a: any) => a?.employee?.user_id)
    .filter(Boolean);

  if (userIds.length === 0) return assignments;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email, phone, avatar_url')
    .in('user_id', userIds);

  if (profilesError) throw profilesError;

  const profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return assignments.map((a: any) => {
    const userId = a?.employee?.user_id;
    return {
      ...a,
      employee: a.employee
        ? { ...a.employee, profile: userId ? profilesMap[userId] || null : null }
        : null,
    };
  });
}

// Helper to fetch profiles and merge into exchange requests
async function mergeProfilesIntoExchangeRequests(supabase: any, requests: any[]) {
  if (!requests || requests.length === 0) return requests;

  // Collect all user IDs from requester and target
  const userIds: string[] = [];
  requests.forEach((r: any) => {
    if (r?.requester?.user_id) userIds.push(r.requester.user_id);
    if (r?.target?.user_id) userIds.push(r.target.user_id);
  });

  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return requests;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email, phone, avatar_url')
    .in('user_id', uniqueUserIds);

  if (profilesError) throw profilesError;

  const profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return requests.map((r: any) => {
    const requesterUserId = r?.requester?.user_id;
    const targetUserId = r?.target?.user_id;
    return {
      ...r,
      requester: r.requester
        ? { ...r.requester, profile: requesterUserId ? profilesMap[requesterUserId] || null : null }
        : null,
      target: r.target
        ? { ...r.target, profile: targetUserId ? profilesMap[targetUserId] || null : null }
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
  // Path: /api-shifts/...
  const subPath = pathParts.slice(1);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    // GET /shifts - List all shifts
    if (req.method === 'GET' && subPath.length === 0) {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /stats - Get shift statistics including assignment count
    if (req.method === 'GET' && subPath[0] === 'stats') {
      const { data: assignments, error } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('is_active', true);
      
      if (error) throw error;
      return jsonResponse({ total_assigned: assignments?.length || 0 });
    }

    // POST /shifts - Create shift
    if (req.method === 'POST' && subPath.length === 0) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('shifts')
        .insert(body)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /shifts/:id - Update shift
    if (req.method === 'PUT' && subPath.length === 1) {
      const id = subPath[0];
      const body = await req.json();
      const { data, error } = await supabase
        .from('shifts')
        .update(body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /shifts/:id - Delete shift
    if (req.method === 'DELETE' && subPath.length === 1) {
      const id = subPath[0];
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /shifts/assignments - List all assignments
    if (req.method === 'GET' && subPath[0] === 'assignments' && subPath.length === 1) {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          *,
          employee:employees(id, employee_id, user_id),
          shift:shifts(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const result = await mergeProfilesIntoAssignments(supabase, data || []);
      return jsonResponse(result);
    }

    // GET /shifts/assignments/my - Get current user's assignment
    if (req.method === 'GET' && subPath[0] === 'assignments' && subPath[1] === 'my') {
      // Get employee ID for current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (!employee) {
        return jsonResponse(null);
      }

      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`*, shift:shifts(*)`)
        .eq('employee_id', employee.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /shifts/assignments - Create assignment
    if (req.method === 'POST' && subPath[0] === 'assignments' && subPath.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_assignments')
        .insert(body)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /shifts/assignments/:id - Update assignment
    if (req.method === 'PUT' && subPath[0] === 'assignments' && subPath.length === 2) {
      const id = subPath[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_assignments')
        .update(body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /shifts/assignments/:id - Delete assignment
    if (req.method === 'DELETE' && subPath[0] === 'assignments' && subPath.length === 2) {
      const id = subPath[1];
      const { error } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /shifts/exchange or /shifts/exchange-requests - List exchange requests
    if (req.method === 'GET' && (subPath[0] === 'exchange' || subPath[0] === 'exchange-requests') && subPath.length === 1) {
      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, user_id),
          target:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, user_id),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(*),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const result = await mergeProfilesIntoExchangeRequests(supabase, data || []);
      return jsonResponse(result);
    }

    // POST /shifts/exchange or /shifts/exchange-requests - Create exchange request
    if (req.method === 'POST' && (subPath[0] === 'exchange' || subPath[0] === 'exchange-requests') && subPath.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .insert(body)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PATCH /shifts/exchange/:id or /shifts/exchange-requests/:id - Update exchange request status
    if (req.method === 'PATCH' && (subPath[0] === 'exchange' || subPath[0] === 'exchange-requests') && subPath.length === 2) {
      const id = subPath[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .update({
          ...body,
          responded_at: body.status !== 'pending' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Shifts API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
