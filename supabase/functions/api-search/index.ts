import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-search', '');
  const method = req.method;

  console.log(`[api-search] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET / or /?q=term - Global search
    if (method === 'GET' && (path === '' || path === '/')) {
      const query = url.searchParams.get('q')?.toLowerCase();
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const modules = url.searchParams.get('modules')?.split(',') || ['employees', 'assets', 'tickets', 'documents'];

      if (!query || query.length < 2) {
        return errorResponse('Search query must be at least 2 characters', 400);
      }

      const results: Record<string, unknown[]> = {};

      // Search employees (admin/hr only or limited fields)
      if (modules.includes('employees')) {
        const { data: employees } = await supabase
          .from('employees')
          .select(`
            id,
            employee_id,
            first_name,
            last_name,
            email,
            status,
            avatar_url,
            department:departments(name)
          `)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
          .eq('status', 'active')
          .limit(limit);

        results.employees = employees || [];
      }

      // Search assets (admin/hr only)
      if (modules.includes('assets') && isAdminOrHR) {
        const { data: assets } = await supabase
          .from('assets')
          .select(`
            id,
            name,
            asset_tag,
            serial_number,
            status,
            category:asset_categories(name)
          `)
          .or(`name.ilike.%${query}%,asset_tag.ilike.%${query}%,serial_number.ilike.%${query}%`)
          .limit(limit);

        results.assets = assets || [];
      }

      // Search helpdesk tickets
      if (modules.includes('tickets')) {
        let ticketQuery = supabase
          .from('helpdesk_tickets')
          .select(`
            id,
            subject,
            status,
            priority,
            category,
            created_at,
            employee:employees(first_name, last_name)
          `)
          .or(`subject.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);

        // Non-admin users can only see their own tickets
        if (!isAdminOrHR) {
          const { data: emp } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', auth.userId)
            .single();
          
          if (emp) {
            ticketQuery = ticketQuery.eq('employee_id', emp.id);
          }
        }

        const { data: tickets } = await ticketQuery;
        results.tickets = tickets || [];
      }

      // Search documents
      if (modules.includes('documents')) {
        let docQuery = supabase
          .from('documents')
          .select(`
            id,
            name,
            type,
            document_category,
            created_at,
            is_company_document
          `)
          .ilike('name', `%${query}%`)
          .limit(limit);

        // Non-admin users can only see their documents or company documents
        if (!isAdminOrHR) {
          const { data: emp } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', auth.userId)
            .single();
          
          if (emp) {
            docQuery = docQuery.or(`employee_id.eq.${emp.id},is_company_document.eq.true`);
          }
        }

        const { data: documents } = await docQuery;
        results.documents = documents || [];
      }

      // Search announcements
      if (modules.includes('announcements')) {
        const { data: announcements } = await supabase
          .from('announcements')
          .select(`
            id,
            title,
            content,
            priority,
            type,
            published_at
          `)
          .eq('is_active', true)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(limit);

        results.announcements = announcements || [];
      }

      // Calculate total results
      const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

      return jsonResponse({
        query,
        total_results: totalResults,
        results,
      });
    }

    // GET /employees - Search employees specifically
    if (method === 'GET' && path === '/employees') {
      const query = url.searchParams.get('q')?.toLowerCase();
      const limit = parseInt(url.searchParams.get('limit') || '20');

      if (!query || query.length < 2) {
        return errorResponse('Search query must be at least 2 characters', 400);
      }

      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          avatar_url,
          department:departments(id, name, code),
          designation:designations(id, name, code)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;

      return jsonResponse({
        query,
        count: employees?.length || 0,
        results: employees || [],
      });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-search] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
