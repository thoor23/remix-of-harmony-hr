import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-settings', '');
  const method = req.method;

  console.log(`[api-settings] ${method} ${path}`);

  try {
    const supabase = getSupabaseClient();

    // GET /public/branding - Public endpoint, no auth required
    if (method === 'GET' && path === '/public/branding') {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'company_branding')
        .maybeSingle();

      if (error) throw error;
      
      const defaultBranding = {
        companyName: 'HRMS Portal',
        companyLogo: null,
        companyFavicon: null,
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
        companyWebsite: '',
        logoSize: 32,
        nameSize: 18,
        nameFontWeight: 'semibold',
        nameItalic: false,
      };

      return jsonResponse({ 
        value: data?.value ? { ...defaultBranding, ...data.value } : defaultBranding 
      });
    }

    // All other endpoints require auth
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET / - Get all settings
    if (method === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:key - Get specific setting
    const keyMatch = path.match(/^\/([a-zA-Z_]+)$/);
    if (method === 'GET' && keyMatch) {
      const key = keyMatch[1];
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return jsonResponse(data || { key, value: null });
    }

    // PUT /:key - Update setting
    if (method === 'PUT' && keyMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const key = keyMatch[1];
      const body = await req.json();

      // Upsert the setting
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('system_settings')
          .update({ value: body.value, updated_at: new Date().toISOString() })
          .eq('key', key)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('system_settings')
          .insert({ key, value: body.value, category: body.category || 'general' })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return jsonResponse(result);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-settings] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
