import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface ExpenseClaim {
  id: string;
  employee_id: string;
  category_id: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  status: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  reimbursed_at: string | null;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-expenses', '');
  const method = req.method;

  console.log(`[api-expenses] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    async function getEmployeeId(): Promise<string | null> {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth!.userId)
        .single();
      return data?.id || null;
    }

    // ============== CATEGORY ENDPOINTS ==============

    // GET /categories - Get all expense categories
    if (method === 'GET' && (path === '/categories' || path === '/categories/')) {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /categories - Create expense category (admin/hr only)
    if (method === 'POST' && (path === '/categories' || path === '/categories/')) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const body = await req.json();
      const { data, error } = await supabase
        .from('expense_categories')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // Category by ID
    const categoryMatch = path.match(/^\/categories\/([a-f0-9-]+)$/);
    if (categoryMatch) {
      const id = categoryMatch[1];

      // PUT /categories/:id - Update expense category
      if (method === 'PUT') {
        if (!isAdminOrHR) {
          return errorResponse('Admin or HR access required', 403);
        }

        const body = await req.json();
        const { data, error } = await supabase
          .from('expense_categories')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return jsonResponse(data);
      }

      // DELETE /categories/:id - Delete expense category
      if (method === 'DELETE') {
        if (!isAdminOrHR) {
          return errorResponse('Admin or HR access required', 403);
        }

        const { error } = await supabase
          .from('expense_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return jsonResponse({ success: true });
      }
    }

    // ============== POLICY ENDPOINTS ==============

    // GET /policies - Get all expense policies
    if (method === 'GET' && (path === '/policies' || path === '/policies/')) {
      const { data, error } = await supabase
        .from('expense_policies')
        .select('*')
        .order('name');

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /policies - Create expense policy (admin only)
    if (method === 'POST' && (path === '/policies' || path === '/policies/')) {
      if (auth.role !== 'admin') {
        return errorResponse('Admin access required', 403);
      }

      const body = await req.json();
      const { data, error } = await supabase
        .from('expense_policies')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // Policy by ID
    const policyMatch = path.match(/^\/policies\/([a-f0-9-]+)$/);
    if (policyMatch) {
      const id = policyMatch[1];

      // PUT /policies/:id - Update expense policy
      if (method === 'PUT') {
        if (auth.role !== 'admin') {
          return errorResponse('Admin access required', 403);
        }

        const body = await req.json();
        const { data, error } = await supabase
          .from('expense_policies')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return jsonResponse(data);
      }

      // DELETE /policies/:id - Delete expense policy
      if (method === 'DELETE') {
        if (auth.role !== 'admin') {
          return errorResponse('Admin access required', 403);
        }

        const { error } = await supabase
          .from('expense_policies')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return jsonResponse({ success: true });
      }
    }

    // ============== EXPENSE CLAIM ENDPOINTS ==============

    // GET /my - Get current user's expenses
    if (method === 'GET' && (path === '/my' || path === '/my/')) {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return jsonResponse([]);
      }

      const { data, error } = await supabase
        .from('expense_claims')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /stats - Get expense statistics (admin/hr)
    if (method === 'GET' && (path === '/stats' || path === '/stats/')) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const { data: claims, error } = await supabase
        .from('expense_claims')
        .select('id, status, amount');

      if (error) throw error;

      const typedClaims = (claims || []) as ExpenseClaim[];

      const stats = {
        total: typedClaims.length,
        pending: typedClaims.filter((c: ExpenseClaim) => c.status === "pending").length,
        approved: typedClaims.filter((c: ExpenseClaim) => c.status === "approved").length,
        rejected: typedClaims.filter((c: ExpenseClaim) => c.status === "rejected").length,
        reimbursed: typedClaims.filter((c: ExpenseClaim) => c.status === "reimbursed").length,
        totalAmount: typedClaims.reduce((sum: number, c: ExpenseClaim) => sum + (Number(c.amount) || 0), 0),
        approvedAmount: typedClaims.filter((c: ExpenseClaim) => c.status === "approved" || c.status === "reimbursed")
          .reduce((sum: number, c: ExpenseClaim) => sum + (Number(c.amount) || 0), 0),
        pendingAmount: typedClaims.filter((c: ExpenseClaim) => c.status === "pending")
          .reduce((sum: number, c: ExpenseClaim) => sum + (Number(c.amount) || 0), 0),
      };

      return jsonResponse(stats);
    }

    // GET / - Get all expense claims (admin/hr only)
    if (method === 'GET' && (path === '' || path === '/')) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }

      const status = url.searchParams.get('status');

      let query = supabase
        .from('expense_claims')
        .select(`
          *,
          category:expense_categories(*),
          employee:employees!expense_claims_employee_id_fkey(
            id,
            employee_id,
            first_name,
            last_name,
            avatar_url,
            department:departments(id, name)
          ),
          reviewer:employees!expense_claims_reviewed_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data || []);
    }

    // POST / - Create expense claim
    if (method === 'POST' && (path === '' || path === '/')) {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return errorResponse('Employee record not found', 404);
      }

      const body = await req.json();

      const { data, error } = await supabase
        .from('expense_claims')
        .insert({
          ...body,
          employee_id: employeeId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // Expense by ID
    const expenseMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (expenseMatch) {
      const id = expenseMatch[1];

      // PATCH /:id - Update expense claim (approve/reject/reimburse)
      if (method === 'PATCH') {
        const body = await req.json();

        // Get original claim
        const { data: originalClaim } = await supabase
          .from('expense_claims')
          .select('*')
          .eq('id', id)
          .single();

        if (!originalClaim) {
          return errorResponse('Expense claim not found', 404);
        }

        const employeeId = await getEmployeeId();

        // Check permissions
        if (body.status && body.status !== 'pending') {
          if (!isAdminOrHR) {
            return errorResponse('Admin or HR access required to approve/reject', 403);
          }
        } else if (originalClaim.employee_id !== employeeId && !isAdminOrHR) {
          return errorResponse('Not authorized', 403);
        }

        const updateData: Record<string, unknown> = { ...body };

        if (body.status === 'approved' || body.status === 'rejected') {
          updateData.reviewed_by = employeeId;
          updateData.reviewed_at = new Date().toISOString();
        }

        if (body.status === 'reimbursed') {
          updateData.reimbursed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('expense_claims')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return jsonResponse(data);
      }

      // DELETE /:id - Delete expense claim
      if (method === 'DELETE') {
        const { data: claim } = await supabase
          .from('expense_claims')
          .select('*')
          .eq('id', id)
          .single();

        if (!claim) {
          return errorResponse('Expense claim not found', 404);
        }

        const employeeId = await getEmployeeId();

        // Only owner can delete pending, admin/hr can delete any
        if (claim.employee_id !== employeeId && !isAdminOrHR) {
          return errorResponse('Not authorized', 403);
        }

        if (claim.status !== 'pending' && !isAdminOrHR) {
          return errorResponse('Can only delete pending claims', 400);
        }

        const { error } = await supabase
          .from('expense_claims')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return jsonResponse({ success: true });
      }
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-expenses] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
