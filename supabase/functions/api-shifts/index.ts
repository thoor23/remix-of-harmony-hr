import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
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

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const companyId = getRequestCompanyId(url, auth);

    // GET /shifts - List all shifts
    if (req.method === 'GET' && subPath.length === 0) {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /stats - Get shift statistics including assignment count
    if (req.method === 'GET' && subPath[0] === 'stats') {
      const { data: assignments, error } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (error) throw error;
      return jsonResponse({ total_assigned: assignments?.length || 0 });
    }

    // POST /shifts - Create shift
    if (req.method === 'POST' && subPath.length === 0) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('shifts')
        .insert(withCompanyId(body, companyId))
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
        .eq('company_id', companyId)
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
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /shifts/assignments - List all assignments
    if (req.method === 'GET' && subPath[0] === 'assignments' && subPath.length === 1) {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          *,
          employee:employees(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          shift:shifts(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // GET /shifts/assignments/my - Get current user's assignment
    if (req.method === 'GET' && subPath[0] === 'assignments' && subPath[1] === 'my') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!employee) {
        return jsonResponse(null);
      }

      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`*, shift:shifts(*)`)
        .eq('employee_id', employee.id)
        .eq('company_id', companyId)
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
        .insert(withCompanyId(body, companyId))
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
        .eq('company_id', companyId)
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
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /shifts/exchange or /shifts/exchange-requests - List exchange requests
    if (req.method === 'GET' && (subPath[0] === 'exchange' || subPath[0] === 'exchange-requests') && subPath.length === 1) {
      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          target:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(*),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // GET /shifts/exchange-requests/my - Get current user's exchange requests
    if (req.method === 'GET' && subPath[0] === 'exchange-requests' && subPath[1] === 'my') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!employee) {
        return jsonResponse([]);
      }

      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
          *,
          requester:employees!shift_exchange_requests_requester_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          target:employees!shift_exchange_requests_target_employee_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          requester_shift:shifts!shift_exchange_requests_requester_shift_id_fkey(*),
          target_shift:shifts!shift_exchange_requests_target_shift_id_fkey(*)
        `)
        .eq('company_id', companyId)
        .or(`requester_id.eq.${employee.id},target_employee_id.eq.${employee.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // POST /shifts/exchange or /shifts/exchange-requests - Create exchange request
    if (req.method === 'POST' && (subPath[0] === 'exchange' || subPath[0] === 'exchange-requests') && subPath.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .insert(withCompanyId(body, companyId))
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT or PATCH /shifts/exchange/:id or /shifts/exchange-requests/:id
    if ((req.method === 'PUT' || req.method === 'PATCH') && (subPath[0] === 'exchange' || subPath[0] === 'exchange-requests') && subPath.length === 2) {
      const id = subPath[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .update({
          ...body,
          responded_at: body.status !== 'pending' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // ===== SHIFT ROTATIONS =====

    // GET /shifts/rotations - List all rotations
    if (req.method === 'GET' && subPath[0] === 'rotations' && subPath.length === 1) {
      const { data, error } = await supabase
        .from('shift_rotations')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // POST /shifts/rotations - Create rotation
    if (req.method === 'POST' && subPath[0] === 'rotations' && subPath.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_rotations')
        .insert(withCompanyId(body, companyId))
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /shifts/rotations/:id - Update rotation
    if (req.method === 'PUT' && subPath[0] === 'rotations' && subPath.length === 2) {
      const id = subPath[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from('shift_rotations')
        .update(body)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();
      
      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /shifts/rotations/:id - Delete rotation
    if (req.method === 'DELETE' && subPath[0] === 'rotations' && subPath.length === 2) {
      const id = subPath[1];
      const { error } = await supabase
        .from('shift_rotations')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Shifts API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
