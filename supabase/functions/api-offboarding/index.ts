import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, getRequestCompanyId, withCompanyId } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-offboarding', '');
  const method = req.method;

  console.log(`[api-offboarding] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const companyId = await getRequestCompanyId(url, auth);
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET / - List all offboarding processes
    if (method === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('offboarding_processes')
        .select(`
          *,
          employee:employees!offboarding_processes_employee_id_fkey(id, employee_id, first_name, last_name, avatar_url),
          handover_employee:employees!offboarding_processes_handover_to_fkey(id, first_name, last_name),
          tasks:offboarding_tasks(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:id - Get specific offboarding process
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data: process, error } = await supabase
        .from('offboarding_processes')
        .select(`
          *,
          employee:employees!offboarding_processes_employee_id_fkey(id, employee_id, first_name, last_name, avatar_url, email, phone, department:departments(name)),
          handover_employee:employees!offboarding_processes_handover_to_fkey(id, first_name, last_name),
          tasks:offboarding_tasks(*)
        `)
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;

      // Get exit interview if exists
      const { data: exitInterview } = await supabase
        .from('exit_interviews')
        .select('*')
        .eq('offboarding_id', id)
        .eq('company_id', companyId)
        .maybeSingle();

      // Get F&F settlement if exists
      const { data: fnfSettlement } = await supabase
        .from('fnf_settlements')
        .select('*')
        .eq('offboarding_id', id)
        .eq('company_id', companyId)
        .maybeSingle();

      return jsonResponse({
        ...process,
        exit_interview: exitInterview,
        fnf_settlement: fnfSettlement,
      });
    }

    // POST / - Create offboarding process
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const body = await req.json();
      
      // Create process
      const { data: process, error: processError } = await supabase
        .from('offboarding_processes')
        .insert(withCompanyId({
          employee_id: body.employee_id,
          exit_type: body.exit_type,
          resignation_date: body.resignation_date,
          last_working_day: body.last_working_day,
          notice_period_days: body.notice_period_days,
          exit_reason: body.exit_reason,
          handover_to: body.handover_to || null,
          notes: body.notes,
          status: body.status || 'initiated',
        }, companyId))
        .select()
        .single();

      if (processError) throw processError;

      // Create default clearance tasks
      const defaultTasks = [
        { title: 'Complete knowledge transfer documentation', category: 'knowledge_transfer', order_index: 0 },
        { title: 'Hand over ongoing projects', category: 'knowledge_transfer', order_index: 1 },
        { title: 'Train replacement or team members', category: 'knowledge_transfer', order_index: 2 },
        { title: 'Return laptop/computer', category: 'asset_return', order_index: 3 },
        { title: 'Return ID card', category: 'asset_return', order_index: 4 },
        { title: 'Return any company property', category: 'asset_return', order_index: 5 },
        { title: 'Revoke email access', category: 'access_revocation', order_index: 6 },
        { title: 'Revoke system access', category: 'access_revocation', order_index: 7 },
        { title: 'Revoke building access', category: 'access_revocation', order_index: 8 },
        { title: 'Clear pending reimbursements', category: 'documentation', order_index: 9 },
        { title: 'Complete no dues clearance', category: 'documentation', order_index: 10 },
        { title: 'Update employee status', category: 'documentation', order_index: 11 },
      ];

      const tasks = defaultTasks.map(task => ({
        ...task,
        company_id: companyId,
        offboarding_id: process.id,
        status: 'pending',
      }));

      await supabase.from('offboarding_tasks').insert(tasks);

      // Create F&F settlement record
      await supabase.from('fnf_settlements').insert(withCompanyId({
        offboarding_id: process.id,
        status: 'pending',
      }, companyId));

      return jsonResponse(process, 201);
    }

    // PUT /:id - Update offboarding process
    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('offboarding_processes')
        .update(body)
        .eq('id', id)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // PUT /:id/tasks/:taskId - Update task
    const taskMatch = path.match(/^\/([a-f0-9-]+)\/tasks\/([a-f0-9-]+)$/);
    if (method === 'PUT' && taskMatch) {
      const [, processId, taskId] = taskMatch;
      const body = await req.json();

      const { data, error } = await supabase
        .from('offboarding_tasks')
        .update({
          ...body,
          completed_at: body.status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;

      // Check if all tasks completed
      const { data: allTasks } = await supabase
        .from('offboarding_tasks')
        .select('status')
        .eq('offboarding_id', processId)
        .eq('company_id', companyId);

      const allCompleted = allTasks?.every(t => t.status === 'completed');
      if (allCompleted) {
        await supabase
          .from('offboarding_processes')
          .update({ status: 'pending_fnf' })
          .eq('id', processId)
          .eq('company_id', companyId);
      } else {
        await supabase
          .from('offboarding_processes')
          .update({ status: 'in_progress' })
          .eq('id', processId)
          .eq('company_id', companyId);
      }

      return jsonResponse(data);
    }

    // POST /:id/interview - Save exit interview
    const interviewMatch = path.match(/^\/([a-f0-9-]+)\/interview$/);
    if (method === 'POST' && interviewMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const processId = interviewMatch[1];
      const body = await req.json();

      // Check if interview exists
      const { data: existing } = await supabase
        .from('exit_interviews')
        .select('id')
        .eq('offboarding_id', processId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('exit_interviews')
          .update(body)
          .eq('id', existing.id)
          .eq('company_id', companyId)
          .select()
          .single();

        if (error) throw error;
        return jsonResponse(data);
      } else {
        const { data, error } = await supabase
          .from('exit_interviews')
          .insert(withCompanyId({
            ...body,
            offboarding_id: processId,
          }, companyId))
          .select()
          .single();

        if (error) throw error;
        return jsonResponse(data, 201);
      }
    }

    // PUT /:id/fnf - Update F&F settlement
    const fnfMatch = path.match(/^\/([a-f0-9-]+)\/fnf$/);
    if (method === 'PUT' && fnfMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const processId = fnfMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('fnf_settlements')
        .update({
          ...body,
          processed_at: body.status === 'processed' ? new Date().toISOString() : null,
        })
        .eq('offboarding_id', processId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;

      // If F&F processed, mark offboarding as completed
      if (body.status === 'processed') {
        await supabase
          .from('offboarding_processes')
          .update({ 
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', processId)
          .eq('company_id', companyId);

        // Update employee status to inactive
        const { data: process } = await supabase
          .from('offboarding_processes')
          .select('employee_id')
          .eq('id', processId)
          .eq('company_id', companyId)
          .single();

        if (process?.employee_id) {
          await supabase
            .from('employees')
            .update({ status: 'inactive' })
            .eq('id', process.employee_id)
            .eq('company_id', companyId);
        }
      }

      return jsonResponse(data);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-offboarding] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
