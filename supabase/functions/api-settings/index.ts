import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

// Helper function to generate default permissions based on legacy role enum
function getDefaultPermissionsForRole(role: string): Array<{
  module: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}> {
  const allModules = [
    'Dashboard', 'Employees', 'Departments', 'Designations', 'Attendance',
    'Leaves', 'Payroll', 'Shifts', 'Documents', 'Assets', 'Helpdesk',
    'Announcements', 'Reports', 'Settings', 'Audit Logs', 'Holidays',
    'Locations', 'Templates', 'Letters', 'Notifications'
  ];

  switch (role) {
    case 'admin':
    case 'hr':
      // Full access to everything
      return allModules.map(m => ({ module: m, create: true, read: true, update: true, delete: true }));

    case 'manager':
      // Read all, CRUD on team management modules
      return allModules.map(m => ({
        module: m,
        create: ['Employees', 'Attendance', 'Leaves', 'Shifts', 'Announcements', 'Helpdesk'].includes(m),
        read: true,
        update: ['Employees', 'Attendance', 'Leaves', 'Shifts', 'Announcements', 'Helpdesk'].includes(m),
        delete: false
      }));

    case 'store_manager':
      // Similar to manager but store-focused
      return allModules.map(m => ({
        module: m,
        create: ['Attendance', 'Announcements', 'Shifts'].includes(m),
        read: true,
        update: ['Attendance', 'Shifts', 'Announcements'].includes(m),
        delete: false
      }));

    case 'employee':
    default:
      // Employee-specific modules with "My" prefix to match sidebar navigation
      const employeeModules = [
        'Employee Dashboard', 'Dashboard', 'My Attendance', 'My Shifts', 
        'My Leaves', 'My Payslips', 'My Documents', 'My Assets', 
        'My Helpdesk', 'My Profile', 'My Settings', 'My Reports', 'Holidays'
      ];
      return employeeModules.map(m => ({
        module: m,
        create: ['My Helpdesk', 'My Leaves', 'My Attendance'].includes(m),
        read: true,
        update: ['My Helpdesk', 'My Profile', 'My Settings'].includes(m),
        delete: false
      }));
  }
}


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
      
      // Get user's role and role_id from user_roles
      const { data: userRole, error: userRoleError } = await supabase
        .from('user_roles')
        .select('role, role_id')
        .eq('user_id', auth.userId)
        .maybeSingle();
      
      if (userRoleError) {
        console.error('[api-settings] Error fetching user role:', userRoleError);
        throw userRoleError;
      }

      // If user has a custom role_id, use that role's permissions
      if (userRole?.role_id) {
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id, name, permissions, role_type')
          .eq('id', userRole.role_id)
          .single();
        
        if (roleError) {
          console.error('[api-settings] Error fetching role:', roleError);
          throw roleError;
        }

        console.log('[api-settings] Found custom role:', role?.name, 'with', (role?.permissions as any[])?.length || 0, 'permissions');
        
        return jsonResponse({
          roleId: role?.id || null,
          roleName: role?.name || null,
          roleType: role?.role_type || 'admin',
          permissions: role?.permissions || []
        });
      }

      // Fallback: Generate default permissions based on the legacy role enum
      const legacyRole = userRole?.role || 'employee';
      console.log('[api-settings] No role_id found, using fallback permissions for:', legacyRole);
      
      const defaultPermissions = getDefaultPermissionsForRole(legacyRole);
      
      return jsonResponse({
        roleId: null,
        roleName: legacyRole,
        roleType: legacyRole === 'employee' ? 'employee' : 'admin',
        permissions: defaultPermissions
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

    // ===== USER ROLE ASSIGNMENTS =====

    // GET /user-role-assignments - Get all user role assignments
    if (method === 'GET' && path === '/user-role-assignments') {
      if (!isAdminOrHR) {
        return errorResponse('Admin access required', 403);
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          role_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data || []);
    }

    // GET /user-role/:userId - Get specific user's role assignment
    const userRoleMatch = path.match(/^\/user-role\/([a-f0-9-]+)$/);
    if (method === 'GET' && userRoleMatch) {
      const userId = userRoleMatch[1];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return jsonResponse(data || { user_id: userId, role: 'employee', role_id: null });
    }

    // PUT /user-role/:userId - Update user's role assignment
    if (method === 'PUT' && userRoleMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin access required', 403);
      }

      const userId = userRoleMatch[1];
      const body = await req.json();
      const { role_id } = body;

      // Check if user role assignment exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role_id })
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'employee', role_id })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Update role user_count
      if (role_id) {
        // Recalculate user count for the role
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role_id);
        
        await supabase
          .from('roles')
          .update({ user_count: count || 0 })
          .eq('id', role_id);
      }

      return jsonResponse(result);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-settings] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
