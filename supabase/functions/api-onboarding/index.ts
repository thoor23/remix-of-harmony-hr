import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, authenticateRequest, checkPermission } from '../_shared/auth.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api-onboarding', '');
  const method = req.method;

  console.log(`[api-onboarding] ${method} ${path}`);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getSupabaseClient();
    const isAdminOrHR = ['admin', 'hr'].includes(auth.role);

    // GET /templates - List all templates
    if (method === 'GET' && path === '/templates') {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /templates - Create template
    if (method === 'POST' && path === '/templates') {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const body = await req.json();
      const { data, error } = await supabase
        .from('onboarding_templates')
        .insert({
          ...body,
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /templates/:id - Update template
    const templateMatch = path.match(/^\/templates\/([a-f0-9-]+)$/);
    if (method === 'PUT' && templateMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const templateId = templateMatch[1];
      const body = await req.json();
      
      const { data, error } = await supabase
        .from('onboarding_templates')
        .update(body)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /templates/:id - Delete template
    if (method === 'DELETE' && templateMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const templateId = templateMatch[1];
      const { error } = await supabase
        .from('onboarding_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /stats - Get onboarding statistics
    if (method === 'GET' && path === '/stats') {
      const { data: processes, error } = await supabase
        .from('onboarding_processes')
        .select('status');

      if (error) throw error;

      const stats = {
        total: processes?.length || 0,
        pending: processes?.filter(p => p.status === 'pending').length || 0,
        in_progress: processes?.filter(p => p.status === 'in_progress').length || 0,
        completed: processes?.filter(p => p.status === 'completed').length || 0,
      };

      return jsonResponse(stats);
    }

    // GET / - List all onboarding processes
    if (method === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('onboarding_processes')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url),
          template:onboarding_templates(id, name),
          tasks:onboarding_tasks(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /:id - Get specific onboarding process
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (method === 'GET' && idMatch) {
      const id = idMatch[1];
      
      const { data, error } = await supabase
        .from('onboarding_processes')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url, email, phone, department:departments(name)),
          template:onboarding_templates(id, name, tasks),
          tasks:onboarding_tasks(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create onboarding process
    if (method === 'POST' && path === '') {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const body = await req.json();
      
      // Create process
      const { data: process, error: processError } = await supabase
        .from('onboarding_processes')
        .insert({
          employee_id: body.employee_id,
          template_id: body.template_id,
          start_date: body.start_date,
          expected_completion_date: body.expected_completion_date,
          status: 'pending',
        })
        .select()
        .single();

      if (processError) throw processError;

      // If template selected, create tasks from template
      if (body.template_id) {
        const { data: template } = await supabase
          .from('onboarding_templates')
          .select('tasks')
          .eq('id', body.template_id)
          .single();

        if (template?.tasks && Array.isArray(template.tasks)) {
          const tasks = template.tasks.map((task: any, index: number) => ({
            onboarding_id: process.id,
            title: task.title,
            description: task.description,
            category: task.category,
            order_index: index,
            status: 'pending',
          }));

          await supabase.from('onboarding_tasks').insert(tasks);
        }
      }

      return jsonResponse(process, 201);
    }

    // PUT /:id - Update onboarding process
    if (method === 'PUT' && idMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const id = idMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('onboarding_processes')
        .update(body)
        .eq('id', id)
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
        .from('onboarding_tasks')
        .update({
          ...body,
          completed_at: body.status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Check if all tasks completed
      const { data: allTasks } = await supabase
        .from('onboarding_tasks')
        .select('status')
        .eq('onboarding_id', processId);

      const allCompleted = allTasks?.every(t => t.status === 'completed');
      if (allCompleted) {
        await supabase
          .from('onboarding_processes')
          .update({ 
            status: 'completed',
            completed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', processId);
      } else {
        await supabase
          .from('onboarding_processes')
          .update({ status: 'in_progress' })
          .eq('id', processId);
      }

      return jsonResponse(data);
    }

    // POST /:id/tasks - Add task to process
    const addTaskMatch = path.match(/^\/([a-f0-9-]+)\/tasks$/);
    if (method === 'POST' && addTaskMatch) {
      if (!isAdminOrHR) {
        return errorResponse('Permission denied', 403);
      }

      const processId = addTaskMatch[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('onboarding_tasks')
        .insert({
          ...body,
          onboarding_id: processId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[api-onboarding] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
