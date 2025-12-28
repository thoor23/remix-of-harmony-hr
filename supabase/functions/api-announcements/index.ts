import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-announcements', '');
  const method = req.method;

  try {
    const auth = await authenticateRequest(req);
    if (!auth) return errorResponse('Unauthorized', 401);

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET /recent - Get recent announcements (for dashboard)
    if (method === 'GET' && path === '/recent') {
      const limit = parseInt(url.searchParams.get('limit') || '5');
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return jsonResponse(data);
    }

    if (method === 'GET' && path === '') {
      const all = url.searchParams.get('all') === 'true';
      let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (!all) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    const idMatch = path.match(/^\/([a-f0-9-]+)$/);

    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);
      const body = await req.json();
      const { data, error } = await supabase.from('announcements').insert({ ...body, created_by: auth.userId }).select().single();
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);
      const { data, error } = await supabase.from('announcements').update(await req.json()).eq('id', idMatch[1]).select().single();
      if (error) throw error;
      return jsonResponse(data);
    }

    if (method === 'DELETE' && idMatch) {
      if (!isAdminOrHR) return errorResponse('Admin or HR access required', 403);
      await supabase.from('announcements').delete().eq('id', idMatch[1]);
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
