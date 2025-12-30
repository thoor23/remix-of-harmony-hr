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

    // GET /user-permissions - Get current user's permissions from their role
    if (method === 'GET' && path === '/user-permissions') {
      console.log('[api-settings] Fetching user permissions for:', auth.userId);
      
      // Get user's role_id from user_roles
      const { data: userRole, error: userRoleError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', auth.userId)
        .maybeSingle();
      
      if (userRoleError) {
        console.error('[api-settings] Error fetching user role:', userRoleError);
        throw userRoleError;
      }

      if (!userRole?.role_id) {
        console.log('[api-settings] No role_id found for user, returning empty permissions');
        return jsonResponse({
          roleId: null,
          roleName: null,
          permissions: []
        });
      }

      // Get role details
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('id', userRole.role_id)
        .single();
      
      if (roleError) {
        console.error('[api-settings] Error fetching role:', roleError);
        throw roleError;
      }

      console.log('[api-settings] Found role:', role?.name, 'with', (role?.permissions as any[])?.length || 0, 'permissions');
      
      return jsonResponse({
        roleId: role?.id || null,
        roleName: role?.name || null,
        permissions: role?.permissions || []
      });
    }

    // GET / - Get all settings
    if (method === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /user-preferences - Get current user's preferences
    if (method === 'GET' && path === '/user-preferences') {
      const prefKey = `user_prefs_${auth.userId}`;
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', prefKey)
        .maybeSingle();

      if (error) throw error;
      return jsonResponse(data?.value || { notifications: {} });
    }

    // POST /user-preferences - Save current user's preferences
    if (method === 'POST' && path === '/user-preferences') {
      const prefKey = `user_prefs_${auth.userId}`;
      const body = await req.json();

      // Check if exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', prefKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: body, updated_at: new Date().toISOString() })
          .eq('key', prefKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert({ key: prefKey, value: body, category: 'user_preferences' });
        if (error) throw error;
      }

      return jsonResponse({ success: true });
    }

    // GET /:key - Get specific setting (exclude 'roles' which has its own handler)
    const keyMatch = path.match(/^\/([a-zA-Z_]+)$/);
    if (method === 'GET' && keyMatch && keyMatch[1] !== 'roles') {
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

    // ===== ROLES MANAGEMENT =====

    // GET /roles - List all roles
    if (method === 'GET' && path === '/roles') {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return jsonResponse(data || []);
    }

    // POST /roles - Create role
    if (method === 'POST' && path === '/roles') {
      if (!isAdminOrHR) {
        return errorResponse('Admin access required', 403);
      }

      const body = await req.json();
      const { data, error } = await supabase
        .from('roles')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // GET /roles/:id - Get specific role
    const roleMatch = path.match(/^\/roles\/([a-f0-9-]+)$/);
    if (method === 'GET' && roleMatch) {
      const id = roleMatch[1];
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // PUT /roles/:id - Update role
    if (method === 'PUT' && roleMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin access required', 403);
      }

      const id = roleMatch[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from('roles')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /roles/:id - Delete role
    if (method === 'DELETE' && roleMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin access required', 403);
      }

      const id = roleMatch[1];
      
      // Check if system role
      const { data: role } = await supabase
        .from('roles')
        .select('is_system')
        .eq('id', id)
        .single();

      if (role?.is_system) {
        return errorResponse('Cannot delete system roles', 400);
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-settings] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
