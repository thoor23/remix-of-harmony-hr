import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, checkIsSuperAdmin, hashPassword } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-super-admin', '');
  const method = req.method;

  console.log(`[api-super-admin] ${method} ${path}`);

  try {
    // Health check
    if (method === 'GET' && (path === '' || path === '/' || path === '/health')) {
      return jsonResponse({ status: 'healthy', service: 'api-super-admin' });
    }

    // Authenticate and verify super admin
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const isSuperAdmin = await checkIsSuperAdmin(auth.userId);
    if (!isSuperAdmin) {
      console.log(`[api-super-admin] Access denied for user ${auth.userId}`);
      return errorResponse('Super admin access required', 403);
    }

    const supabase = getSupabaseClient();

    // GET /stats - Platform statistics
    if (method === 'GET' && path === '/stats') {
      // Get company counts
      const { data: companies } = await supabase
        .from('companies')
        .select('id, is_active, subscription_plan, created_at, name, code, logo_url')
        .order('created_at', { ascending: false });

      const totalCompanies = companies?.length || 0;
      const activeCompanies = companies?.filter(c => c.is_active).length || 0;

      // Get employee count
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Get user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Group by plan
      const planCounts: Record<string, number> = {};
      companies?.forEach(c => {
        const plan = c.subscription_plan || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      const companiesByPlan = Object.entries(planCounts).map(([plan, count]) => ({
        plan,
        count,
      }));

      return jsonResponse({
        totalCompanies,
        activeCompanies,
        totalEmployees: employeeCount || 0,
        totalUsers: userCount || 0,
        companiesByPlan,
        recentCompanies: companies?.slice(0, 5) || [],
      });
    }

    // GET /companies - List all companies
    if (method === 'GET' && path === '/companies') {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[api-super-admin] Error fetching companies:', error);
        return errorResponse('Failed to fetch companies', 500);
      }

      // Get employee counts for each company
      const { data: employeeCounts } = await supabase
        .from('employees')
        .select('company_id');

      const countByCompany: Record<string, number> = {};
      employeeCounts?.forEach(e => {
        countByCompany[e.company_id] = (countByCompany[e.company_id] || 0) + 1;
      });

      const companiesWithCounts = companies?.map(c => ({
        ...c,
        employee_count: countByCompany[c.id] || 0,
      }));

      return jsonResponse({ data: companiesWithCounts });
    }

    // GET /companies/:identifier - Get single company (supports id or code)
    const companyMatch = path.match(/^\/companies\/([^\/]+)$/);
    if (method === 'GET' && companyMatch) {
      const identifier = companyMatch[1];
      
      // Check if identifier is UUID or code
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidPattern.test(identifier);
      
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq(isUuid ? 'id' : 'code', isUuid ? identifier : identifier.toUpperCase())
        .single();

      if (error || !company) {
        return errorResponse('Company not found', 404);
      }

      // Get employee count
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id);

      return jsonResponse({ ...company, employee_count: count || 0 });
    }

    // POST /companies - Create company
    if (method === 'POST' && path === '/companies') {
      const body = await req.json();
      const { name, code, email, phone, address, website, domain, max_employees, subscription_plan } = body;

      if (!name || !code || !email) {
        return errorResponse('Name, code, and email are required', 400);
      }

      // Check if code is unique
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (existing) {
        return errorResponse('Company code already exists', 409);
      }

      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          name,
          code: code.toUpperCase(),
          email,
          phone,
          address,
          website,
          domain,
          max_employees: max_employees || 50,
          subscription_plan: subscription_plan || 'free',
          subscription_status: 'active',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('[api-super-admin] Error creating company:', error);
        return errorResponse('Failed to create company', 500);
      }

      console.log(`[api-super-admin] Company created: ${company.id}`);
      return jsonResponse(company, 201);
    }

    // PUT /companies/:id - Update company
    const updateCompanyMatch = path.match(/^\/companies\/([^\/]+)$/);
    if (method === 'PUT' && updateCompanyMatch) {
      const companyId = updateCompanyMatch[1];
      const body = await req.json();

      const { error } = await supabase
        .from('companies')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) {
        console.error('[api-super-admin] Error updating company:', error);
        return errorResponse('Failed to update company', 500);
      }

      const { data: updated } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      return jsonResponse(updated);
    }

    // PATCH /companies/:id/status - Toggle company status
    const statusMatch = path.match(/^\/companies\/([^\/]+)\/status$/);
    if (method === 'PATCH' && statusMatch) {
      const companyId = statusMatch[1];
      const { is_active } = await req.json();

      const { error } = await supabase
        .from('companies')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) {
        return errorResponse('Failed to update company status', 500);
      }

      return jsonResponse({ success: true });
    }

    // DELETE /companies/:id - Deactivate company (soft delete)
    const deleteCompanyMatch = path.match(/^\/companies\/([^\/]+)$/);
    if (method === 'DELETE' && deleteCompanyMatch) {
      const companyId = deleteCompanyMatch[1];

      const { error } = await supabase
        .from('companies')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) {
        return errorResponse('Failed to deactivate company', 500);
      }

      return jsonResponse({ success: true });
    }

    // GET /super-admins - List super admins
    if (method === 'GET' && path === '/super-admins') {
      const { data: superAdmins, error } = await supabase
        .from('super_admins')
        .select('id, user_id, created_at');

      if (error) {
        return errorResponse('Failed to fetch super admins', 500);
      }

      // Get user emails
      const userIds = superAdmins?.map(sa => sa.user_id) || [];
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      const adminsWithUsers = superAdmins?.map(sa => ({
        ...sa,
        user: userMap.get(sa.user_id),
      }));

      return jsonResponse({ data: adminsWithUsers });
    }

    // POST /super-admins - Add super admin
    if (method === 'POST' && path === '/super-admins') {
      const { user_id } = await req.json();

      if (!user_id) {
        return errorResponse('User ID is required', 400);
      }

      // Check if already super admin
      const { data: existing } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (existing) {
        return errorResponse('User is already a super admin', 409);
      }

      const { data, error } = await supabase
        .from('super_admins')
        .insert({ user_id })
        .select()
        .single();

      if (error) {
        return errorResponse('Failed to add super admin', 500);
      }

      return jsonResponse(data, 201);
    }

    // DELETE /super-admins/:id - Remove super admin
    const removeSuperAdminMatch = path.match(/^\/super-admins\/([^\/]+)$/);
    if (method === 'DELETE' && removeSuperAdminMatch) {
      const id = removeSuperAdminMatch[1];

      // Prevent removing self
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('id', id)
        .single();

      if (superAdmin?.user_id === auth.userId) {
        return errorResponse('Cannot remove yourself as super admin', 400);
      }

      const { error } = await supabase
        .from('super_admins')
        .delete()
        .eq('id', id);

      if (error) {
        return errorResponse('Failed to remove super admin', 500);
      }

      return jsonResponse({ success: true });
    }

    // POST /companies/:id/admin - Create admin user for company
    const createAdminMatch = path.match(/^\/companies\/([^\/]+)\/admin$/);
    if (method === 'POST' && createAdminMatch) {
      const companyId = createAdminMatch[1];
      const { email, password, first_name, last_name } = await req.json();

      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        return errorResponse('User with this email already exists', 409);
      }

      // Create user
      const passwordHash = await hashPassword(password);
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          company_id: companyId,
          is_active: true,
          email_confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error('[api-super-admin] Error creating user:', userError);
        return errorResponse('Failed to create user', 500);
      }

      // Create employee record
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
          user_id: user.id,
          company_id: companyId,
          email: email.toLowerCase(),
          first_name,
          last_name,
          employee_id: `ADM-${Date.now()}`,
          date_of_joining: new Date().toISOString().split('T')[0],
          employment_type: 'full-time',
          status: 'active',
        })
        .select()
        .single();

      if (empError) {
        console.error('[api-super-admin] Error creating employee:', empError);
      }

      // Assign admin role
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'admin',
        company_id: companyId,
      });

      console.log(`[api-super-admin] Admin created for company ${companyId}`);

      return jsonResponse({ user, employee }, 201);
    }

    // GET /users - List all users (for adding super admins)
    if (method === 'GET' && path === '/users') {
      const search = url.searchParams.get('search') || '';
      
      let query = supabase
        .from('users')
        .select('id, email, is_active, company_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return errorResponse('Failed to fetch users', 500);
      }

      return jsonResponse({ data });
    }

    // GET /audit-logs - Platform audit logs
    if (method === 'GET' && path === '/audit-logs') {
      const module = url.searchParams.get('module');
      const action = url.searchParams.get('action');
      
      let query = supabase
        .from('audit_logs')
        .select('*, company:companies(name)')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (module && module !== 'all') {
        query = query.eq('module', module);
      }
      if (action && action !== 'all') {
        query = query.eq('action', action);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[api-super-admin] Error fetching audit logs:', error);
        return errorResponse('Failed to fetch audit logs', 500);
      }
      
      return jsonResponse({ 
        data: data?.map(log => ({
          ...log,
          company_name: log.company?.name
        })) 
      });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-super-admin] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
