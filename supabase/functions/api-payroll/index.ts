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

    // GET /payslips - List all payslips
    if (req.method === 'GET' && subPath[0] === 'payslips' && subPath.length === 1) {
      const payPeriod = url.searchParams.get('pay_period');
      let query = supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(id, employee_id, user_id, first_name, last_name, email, avatar_url)
        `)
        .order('pay_date', { ascending: false });

      if (payPeriod) {
        query = query.eq('pay_period', payPeriod);
      }

      const { data, error } = await query;
      if (error) throw error;

      return jsonResponse(data || []);
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

    // POST /payslips/generate-all - Generate payslips for all employees with salary structures
    if (req.method === 'POST' && subPath[0] === 'payslips' && subPath[1] === 'generate-all') {
      const body = await req.json();
      const payPeriod = body.pay_period;
      const payDate = body.pay_date || new Date().toISOString().split('T')[0];

      // Get all salary structures with employee info
      const { data: salaryStructures, error: ssError } = await supabase
        .from('salary_structures')
        .select('*')
        .order('effective_from', { ascending: false });

      if (ssError) throw ssError;

      // Get existing payslips for this period
      const { data: existingPayslips } = await supabase
        .from('payslips')
        .select('employee_id')
        .eq('pay_period', payPeriod);

      const existingEmployeeIds = new Set((existingPayslips || []).map((p: any) => p.employee_id));

      // Group salary structures by employee (latest one wins)
      const employeeSalaryMap: Record<string, any> = {};
      for (const ss of salaryStructures || []) {
        if (!employeeSalaryMap[ss.employee_id]) {
          employeeSalaryMap[ss.employee_id] = ss;
        }
      }

      // Generate payslips
      const payslipsToInsert = [];
      for (const [employeeId, salary] of Object.entries(employeeSalaryMap)) {
        if (existingEmployeeIds.has(employeeId)) continue; // Skip if already exists

        const grossEarnings = 
          (salary.basic_salary || 0) +
          (salary.hra || 0) +
          (salary.transport_allowance || 0) +
          (salary.medical_allowance || 0) +
          (salary.other_allowances || 0);

        const totalDeductions =
          (salary.pf_deduction || 0) +
          (salary.tax_deduction || 0) +
          (salary.other_deductions || 0);

        const netPay = grossEarnings - totalDeductions;

        payslipsToInsert.push({
          employee_id: employeeId,
          pay_period: payPeriod,
          pay_date: payDate,
          basic_salary: salary.basic_salary || 0,
          gross_earnings: grossEarnings,
          total_deductions: totalDeductions,
          net_pay: netPay,
          status: 'generated',
        });
      }

      if (payslipsToInsert.length > 0) {
        const { data, error } = await supabase
          .from('payslips')
          .insert(payslipsToInsert)
          .select();

        if (error) throw error;
        return jsonResponse({ 
          generated: data?.length || 0, 
          skipped: existingEmployeeIds.size,
          message: `Generated ${data?.length || 0} payslips`
        });
      }

      return jsonResponse({ 
        generated: 0, 
        skipped: existingEmployeeIds.size,
        message: 'No new payslips to generate'
      });
    }

    // GET /salary-structures - List all salary structures
    if (req.method === 'GET' && subPath[0] === 'salary-structures' && subPath.length === 1) {
      const { data, error } = await supabase
        .from('salary_structures')
        .select(`
          *,
          employee:employees(id, employee_id, user_id, first_name, last_name, email, avatar_url)
        `)
        .order('effective_from', { ascending: false });

      if (error) throw error;

      return jsonResponse(data || []);
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
