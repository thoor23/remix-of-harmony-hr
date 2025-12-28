import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-designations', '');
  const method = req.method;

  console.log(`[api-designations] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET / - Get all designations
    if (method === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('designations')
        .select('*, department:departments(id, name, code)')
        .order('name');

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:id - Get specific designation
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data, error } = await supabase
        .from('designations')
        .select('*, department:departments(id, name, code)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create designation
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();

      // Check for duplicate code
      const { data: existing } = await supabase
        .from('designations')
        .select('id')
        .eq('code', body.code)
        .single();

      if (existing) {
        return errorResponse('Designation code already exists', 409);
      }

      const { data, error } = await supabase
        .from('designations')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PATCH /:id - Update designation
    if ((method === 'PATCH' || method === 'PUT') && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      // Check for duplicate code if changing
      if (body.code) {
        const { data: existing } = await supabase
          .from('designations')
          .select('id')
          .eq('code', body.code)
          .neq('id', id)
          .single();

        if (existing) {
          return errorResponse('Designation code already exists', 409);
        }
      }

      const { data, error } = await supabase
        .from('designations')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete designation
    if (method === 'DELETE' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];

      // Check for employees
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('designation_id', id)
        .eq('status', 'active');

      if (count && count > 0) {
        return errorResponse('Cannot delete designation with active employees', 400);
      }

      const { error } = await supabase
        .from('designations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-designations] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
