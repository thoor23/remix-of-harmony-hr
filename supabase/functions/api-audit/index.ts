import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

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

    // Only admins can access audit logs
    if (auth.role !== 'admin') {
      return errorResponse('Forbidden', 403);
    }

    // GET / - List audit logs with filters
    if (req.method === 'GET' && subPath.length === 0) {
      const action = url.searchParams.get('action');
      const module = url.searchParams.get('module');
      const performedBy = url.searchParams.get('performed_by');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (action) query = query.eq('action', action);
      if (module) query = query.eq('module', module);
      if (performedBy) query = query.eq('performed_by', performedBy);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create audit log
    if (req.method === 'POST' && subPath.length === 0) {
      const body = await req.json();
      
      // Get performer name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', auth.userId)
        .maybeSingle();

      const performerName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : 'Unknown';

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          action: body.action,
          module: body.module,
          description: body.description,
          metadata: body.metadata || {},
          performed_by: auth.userId,
          performer_name: performerName,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // GET /actions - Get distinct actions for filtering
    if (req.method === 'GET' && subPath[0] === 'actions') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .order('action');

      if (error) throw error;
      
      const uniqueActions = [...new Set(data?.map(d => d.action) || [])];
      return jsonResponse(uniqueActions);
    }

    // GET /modules - Get distinct modules for filtering
    if (req.method === 'GET' && subPath[0] === 'modules') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('module')
        .order('module');

      if (error) throw error;
      
      const uniqueModules = [...new Set(data?.map(d => d.module) || [])];
      return jsonResponse(uniqueModules);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Audit API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
