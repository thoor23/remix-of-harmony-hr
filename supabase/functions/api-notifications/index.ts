import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest, getRequestCompanyId, withCompanyId } from '../_shared/auth.ts';

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

    const companyId = getRequestCompanyId(url, auth);
    const isAdminOrHR = auth.role === 'admin' || auth.role === 'hr';

    // GET / - List user's notifications
    if (req.method === 'GET' && subPath.length === 0) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST / - Create notification
    if (req.method === 'POST' && subPath.length === 0) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('notifications')
        .insert(withCompanyId({
          ...body,
          user_id: body.user_id || auth.userId
        }, companyId))
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /:id/read - Mark notification as read
    if (req.method === 'PUT' && subPath.length === 2 && subPath[1] === 'read') {
      const id = subPath[0];
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // PUT /read-all - Mark all notifications as read
    if (req.method === 'PUT' && subPath[0] === 'read-all') {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.userId)
        .eq('company_id', companyId)
        .eq('is_read', false);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // DELETE /:id - Delete notification
    if (req.method === 'DELETE' && subPath.length === 1 && subPath[0] !== 'all') {
      const id = subPath[0];
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', auth.userId)
        .eq('company_id', companyId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // DELETE /all - Delete all notifications
    if (req.method === 'DELETE' && subPath[0] === 'all') {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', auth.userId)
        .eq('company_id', companyId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /targeted - List targeted notifications (admin/hr)
    if (req.method === 'GET' && subPath[0] === 'targeted') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }
      
      const { data, error } = await supabase
        .from('targeted_notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /targeted - Send targeted notification
    if (req.method === 'POST' && subPath[0] === 'targeted') {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }
      
      const body = await req.json();
      const { title, message, type, priority, target_type, target_ids } = body;

      // Create targeted notification record
      const { data: targetedNotification, error: targetedError } = await supabase
        .from('targeted_notifications')
        .insert(withCompanyId({
          title,
          message,
          type: type || 'info',
          priority: priority || 'medium',
          target_type: target_type || 'all',
          target_ids: target_ids || [],
          sent_by: auth.userId
        }, companyId))
        .select()
        .single();

      if (targetedError) throw targetedError;

      // Get target user IDs based on target_type (filtered by company)
      let userIds: string[] = [];
      
      if (target_type === 'all') {
        // Get all employees in the company
        const { data: employees } = await supabase
          .from('employees')
          .select('user_id')
          .eq('company_id', companyId)
          .not('user_id', 'is', null);
        
        userIds = employees?.map((e: { user_id: string }) => e.user_id) || [];
      } else if (target_type === 'department') {
        const { data: employees } = await supabase
          .from('employees')
          .select('user_id')
          .eq('company_id', companyId)
          .in('department_id', target_ids)
          .not('user_id', 'is', null);
        
        userIds = employees?.map((e: { user_id: string }) => e.user_id) || [];
      } else if (target_type === 'employees') {
        const { data: employees } = await supabase
          .from('employees')
          .select('user_id')
          .eq('company_id', companyId)
          .in('id', target_ids)
          .not('user_id', 'is', null);
        
        userIds = employees?.map((e: { user_id: string }) => e.user_id) || [];
      }

      // Create individual notifications for each user
      const notifications = userIds.map(userId => withCompanyId({
        user_id: userId,
        title,
        message,
        type: type || 'info'
      }, companyId));

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      return jsonResponse({ 
        targetedNotification, 
        recipientCount: notifications.length 
      }, 201);
    }

    // DELETE /targeted/:id - Delete targeted notification record
    if (req.method === 'DELETE' && subPath[0] === 'targeted' && subPath.length === 2) {
      if (!isAdminOrHR) {
        return errorResponse('Admin or HR access required', 403);
      }
      
      const id = subPath[1];
      const { error } = await supabase
        .from('targeted_notifications')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Notifications API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
