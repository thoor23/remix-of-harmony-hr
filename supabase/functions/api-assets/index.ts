import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, getRequestCompanyId, withCompanyId } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-assets', '');
  const method = req.method;

  console.log(`[api-assets] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const companyId = getRequestCompanyId(url, auth);
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET /categories - List asset categories
    if (method === 'GET' && path === '/categories') {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /stats - Get asset statistics
    if (method === 'GET' && path === '/stats') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { data: assets, error } = await supabase
        .from('assets')
        .select('status, purchase_cost')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats = {
        totalAssets: assets?.length || 0,
        totalValue: assets?.reduce((sum, a) => sum + (Number(a.purchase_cost) || 0), 0) || 0,
        byStatus: {
          available: assets?.filter(a => a.status === 'available').length || 0,
          assigned: assets?.filter(a => a.status === 'assigned').length || 0,
          maintenance: assets?.filter(a => a.status === 'maintenance').length || 0,
          retired: assets?.filter(a => a.status === 'retired').length || 0,
        },
      };

      return jsonResponse(stats);
    }

    // GET /assignments - List asset assignments
    if (method === 'GET' && path === '/assignments') {
      const assetId = url.searchParams.get('asset_id');
      
      let query = supabase
        .from('asset_assignments')
        .select(`
          *,
          asset:assets(*),
          employee:employees!asset_assignments_employee_id_fkey(id, first_name, last_name, employee_id),
          assigned_by_employee:employees!asset_assignments_assigned_by_fkey(id, first_name, last_name),
          location:stores(id, name, code)
        `)
        .eq('company_id', companyId)
        .order('assigned_date', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /transfers - List asset transfers
    if (method === 'GET' && path === '/transfers') {
      const assetId = url.searchParams.get('asset_id');
      const locationId = url.searchParams.get('location_id');
      
      let query = supabase
        .from('asset_transfers')
        .select(`
          *,
          asset:assets(id, asset_tag, name),
          from_location:stores!asset_transfers_from_location_id_fkey(id, name, code, type),
          to_location:stores!asset_transfers_to_location_id_fkey(id, name, code, type),
          transferred_by_employee:employees!asset_transfers_transferred_by_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('transfer_date', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }
      if (locationId) {
        query = query.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /maintenance - List asset maintenance
    if (method === 'GET' && path === '/maintenance') {
      const assetId = url.searchParams.get('asset_id');
      
      let query = supabase
        .from('asset_maintenance')
        .select(`
          *,
          asset:assets(id, asset_tag, name),
          created_by_employee:employees!asset_maintenance_created_by_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /maintenance - Create maintenance record
    if (method === 'POST' && path === '/maintenance') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();
      
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      const { data, error } = await supabase
        .from('asset_maintenance')
        .insert(withCompanyId({
          ...body,
          created_by: employee?.id,
        }, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /maintenance/:id - Update maintenance record
    const maintenanceMatch = path.match(/^\/maintenance\/([a-f0-9-]+)$/);
    if (method === 'PUT' && maintenanceMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = maintenanceMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('asset_maintenance')
        .update(body)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /my - Get assets assigned to current employee
    if (method === 'GET' && path === '/my') {
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      if (empError || !employee) {
        console.log('[api-assets] No employee found for user:', auth.userId);
        return jsonResponse([]);
      }

      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(id, name, icon)
        `)
        .eq('company_id', companyId)
        .eq('assigned_to', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log(`[api-assets] Found ${data?.length || 0} assets for employee ${employee.id}`);
      return jsonResponse(data || []);
    }

    // GET /maintenance-requests - List maintenance requests
    if (method === 'GET' && path === '/maintenance-requests') {
      const status = url.searchParams.get('status');
      const employeeId = url.searchParams.get('employee_id');
      
      let query = supabase
        .from('asset_maintenance_requests')
        .select(`
          *,
          asset:assets(id, asset_tag, name, category:asset_categories(id, name)),
          employee:employees!asset_maintenance_requests_employee_id_fkey(id, first_name, last_name, employee_id),
          reviewed_by_employee:employees!asset_maintenance_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /maintenance-requests/my - Get current user's maintenance requests
    if (method === 'GET' && path === '/maintenance-requests/my') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      if (!employee) {
        return jsonResponse([]);
      }

      const { data, error } = await supabase
        .from('asset_maintenance_requests')
        .select(`
          *,
          asset:assets(id, asset_tag, name, category:asset_categories(id, name))
        `)
        .eq('company_id', companyId)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data || []);
    }

    // POST /maintenance-requests - Create maintenance request
    if (method === 'POST' && path === '/maintenance-requests') {
      const body = await req.json();
      
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      if (!employee) {
        return errorResponse('Employee not found', 404);
      }

      const { data, error } = await supabase
        .from('asset_maintenance_requests')
        .insert(withCompanyId({
          ...body,
          employee_id: employee.id,
          status: 'pending',
        }, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /maintenance-requests/:id - Update maintenance request
    const maintenanceRequestMatch = path.match(/^\/maintenance-requests\/([a-f0-9-]+)$/);
    if (method === 'PUT' && maintenanceRequestMatch) {
      const id = maintenanceRequestMatch[1];
      const body = await req.json();

      // Get reviewer employee ID if updating status
      let updateData = { ...body };
      if (body.status && body.status !== 'pending' && isAdminOrHR) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', auth.userId)
          .eq('company_id', companyId)
          .single();
        
        updateData.reviewed_by = employee?.id;
        updateData.reviewed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('asset_maintenance_requests')
        .update(updateData)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET / - List all assets
    if (method === 'GET' && path === '') {
      const status = url.searchParams.get('status');
      const categoryId = url.searchParams.get('category_id');
      const locationId = url.searchParams.get('location_id');
      const search = url.searchParams.get('search');

      let query = supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          location:stores!assets_location_id_fkey(id, name, code, type),
          assignee:employees!assets_assigned_to_fkey(id, first_name, last_name, employee_id)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,asset_tag.ilike.%${search}%,serial_number.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:id - Get specific asset
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data: asset, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          location:stores!assets_location_id_fkey(id, name, code, type),
          assignee:employees!assets_assigned_to_fkey(id, first_name, last_name, employee_id)
        `)
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      if (!asset) {
        return errorResponse('Asset not found', 404);
      }

      return jsonResponse(asset);
    }

    // POST / - Create asset
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('assets')
        .insert(withCompanyId(body, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /:id - Update asset
    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('assets')
        .update(body)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete asset
    if (method === 'DELETE' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = idMatch[1];

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // POST /assign - Assign asset to employee
    if (method === 'POST' && path === '/assign') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { asset_id, employee_id, location_id, condition_on_assign, notes } = await req.json();
      
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      const { error: assignmentError } = await supabase
        .from('asset_assignments')
        .insert(withCompanyId({
          asset_id,
          employee_id,
          location_id,
          assigned_by: currentEmployee?.id,
          condition_on_assign,
          notes,
        }, companyId));

      if (assignmentError) throw assignmentError;

      const { error: assetError } = await supabase
        .from('assets')
        .update({
          assigned_to: employee_id,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned',
        })
        .eq('id', asset_id)
        .eq('company_id', companyId);

      if (assetError) throw assetError;

      return jsonResponse({ success: true });
    }

    // POST /unassign - Unassign asset
    if (method === 'POST' && path === '/unassign') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { asset_id, condition_on_return, notes } = await req.json();
      
      const { data: assignment } = await supabase
        .from('asset_assignments')
        .select('id')
        .eq('asset_id', asset_id)
        .eq('company_id', companyId)
        .is('returned_date', null)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .single();

      if (assignment) {
        await supabase
          .from('asset_assignments')
          .update({
            returned_date: new Date().toISOString().split('T')[0],
            condition_on_return,
            notes,
          })
          .eq('id', assignment.id);
      }

      const { error } = await supabase
        .from('assets')
        .update({
          assigned_to: null,
          assigned_date: null,
          status: 'available',
          condition: condition_on_return || 'good',
        })
        .eq('id', asset_id)
        .eq('company_id', companyId);

      if (error) throw error;

      return jsonResponse({ success: true });
    }

    // POST /transfer - Transfer asset to another location
    if (method === 'POST' && path === '/transfer') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { asset_id, to_location_id, reason, notes } = await req.json();
      
      const { data: asset } = await supabase
        .from('assets')
        .select('location_id')
        .eq('id', asset_id)
        .eq('company_id', companyId)
        .single();

      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .single();

      const { error: transferError } = await supabase
        .from('asset_transfers')
        .insert(withCompanyId({
          asset_id,
          from_location_id: asset?.location_id,
          to_location_id,
          reason,
          notes,
          transferred_by: currentEmployee?.id,
          status: 'completed',
        }, companyId));

      if (transferError) throw transferError;

      const { error: assetError } = await supabase
        .from('assets')
        .update({ location_id: to_location_id })
        .eq('id', asset_id)
        .eq('company_id', companyId);

      if (assetError) throw assetError;

      return jsonResponse({ success: true });
    }

    // POST /categories - Create category
    if (method === 'POST' && path === '/categories') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('asset_categories')
        .insert(withCompanyId(body, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /categories/:id - Update category
    const categoryMatch = path.match(/^\/categories\/([a-f0-9-]+)$/);
    if (method === 'PUT' && categoryMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = categoryMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('asset_categories')
        .update(body)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /categories/:id - Delete category
    if (method === 'DELETE' && categoryMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const id = categoryMatch[1];

      const { error } = await supabase
        .from('asset_categories')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-assets] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
