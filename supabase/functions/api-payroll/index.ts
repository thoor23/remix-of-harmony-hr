import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper to fetch profiles and merge into records
async function mergeProfilesIntoRecords(supabase: any, records: any[]) {
  if (!records || records.length === 0) return records;

  const userIds = records
    .map((r: any) => r?.employee?.user_id)
    .filter(Boolean);

  if (userIds.length === 0) return records;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, email, phone, avatar_url')
    .in('user_id', userIds);

  if (profilesError) throw profilesError;

  const profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return records.map((r: any) => {
    const userId = r?.employee?.user_id;
    return {
      ...r,
      employee: r.employee
        ? { ...r.employee, profile: userId ? profilesMap[userId] || null : null }
        : null,
    };
  });
}

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

    // GET /payslips - List all payslips
    if (req.method === 'GET' && subPath[0] === 'payslips' && subPath.length === 1) {
      const payPeriod = url.searchParams.get('pay_period');
      let query = supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .order('pay_date', { ascending: false });

      if (payPeriod) {
        query = query.eq('pay_period', payPeriod);
      }

      const { data, error } = await query;
      if (error) throw error;

      const result = await mergeProfilesIntoRecords(supabase, data || []);
      return jsonResponse(result);
    }

    // GET /payslips/my - Get current user's payslips
    if (req.method === 'GET' && subPath[0] === 'payslips' && subPath[1] === 'my') {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (!employee) {
        return jsonResponse([]);
      }

      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .order('pay_date', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /payslips/employee/:id - Get employee payslips
    if (req.method === 'GET' && subPath[0] === 'payslips' && subPath[1] === 'employee' && subPath.length === 3) {
      const employeeId = subPath[2];
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('pay_date', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /payslips - Generate payslip
    if (req.method === 'POST' && subPath[0] === 'payslips' && subPath.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('payslips')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // GET /salary-structures - List all salary structures
    if (req.method === 'GET' && subPath[0] === 'salary-structures' && subPath.length === 1) {
      const { data, error } = await supabase
        .from('salary_structures')
        .select(`
          *,
          employee:employees(id, employee_id, user_id)
        `)
        .order('effective_from', { ascending: false });

      if (error) throw error;

      const result = await mergeProfilesIntoRecords(supabase, data || []);
      return jsonResponse(result);
    }

    // GET /salary-structures/employee/:id - Get employee salary structure
    if (req.method === 'GET' && subPath[0] === 'salary-structures' && subPath[1] === 'employee' && subPath.length === 3) {
      const employeeId = subPath[2];
      const { data, error } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_from', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /salary-structures - Create salary structure
    if (req.method === 'POST' && subPath[0] === 'salary-structures' && subPath.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('salary_structures')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /salary-structures/:id - Update salary structure
    if (req.method === 'PUT' && subPath[0] === 'salary-structures' && subPath.length === 2) {
      const id = subPath[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from('salary_structures')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /salary-structures/:id - Delete salary structure
    if (req.method === 'DELETE' && subPath[0] === 'salary-structures' && subPath.length === 2) {
      const id = subPath[1];
      const { error } = await supabase
        .from('salary_structures')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Payroll API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
