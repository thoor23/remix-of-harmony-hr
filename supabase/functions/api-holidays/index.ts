import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, getRequestCompanyId, withCompanyId } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-holidays', '');
  const method = req.method;

  try {
    const auth = await authenticateRequest(req);
    if (!auth) return errorResponse('Unauthorized', 401);

    const supabase = getSupabaseClient();
    const companyId = getRequestCompanyId(url, auth);
    const isAdmin = auth.role === 'admin';

    if (method === 'GET' && path === '') {
      const year = url.searchParams.get('year');
      let query = supabase
        .from('holidays')
        .select('*')
        .eq('company_id', companyId)
        .order('date');
      if (year) query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    
    if (method === 'POST' && path === '') {
      if (!isAdmin) return errorResponse('Admin access required', 403);
      const body = await req.json();
      const { data, error } = await supabase
        .from('holidays')
        .insert(withCompanyId(body, companyId))
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    if (method === 'PUT' && idMatch) {
      if (!isAdmin) return errorResponse('Admin access required', 403);
      const { data, error } = await supabase
        .from('holidays')
        .update(await req.json())
        .eq('id', idMatch[1])
        .eq('company_id', companyId)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data);
    }

    if (method === 'DELETE' && idMatch) {
      if (!isAdmin) return errorResponse('Admin access required', 403);
      await supabase
        .from('holidays')
        .delete()
        .eq('id', idMatch[1])
        .eq('company_id', companyId);
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
