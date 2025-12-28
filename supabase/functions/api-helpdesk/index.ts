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

    // GET / - List all tickets (admin/hr) or user's tickets
    if (req.method === 'GET' && subPath.length === 0) {
      const isAdminOrHR = auth.role === 'admin' || auth.role === 'hr';
      
      let query = supabase
        .from('helpdesk_tickets')
        .select(`
          *,
          employee:employees!helpdesk_tickets_employee_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          assigned:employees!helpdesk_tickets_assigned_to_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (!isAdminOrHR) {
        // Get employee ID for current user
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', auth.userId)
          .maybeSingle();

        if (employee) {
          query = query.eq('employee_id', employee.id);
        } else {
          return jsonResponse([]);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return jsonResponse(data || []);
    }

    // GET /employee/:id - Get employee's tickets
    if (req.method === 'GET' && subPath[0] === 'employee' && subPath.length === 2) {
      const employeeId = subPath[1];
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select(`
          *,
          employee:employees!helpdesk_tickets_employee_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          assigned:employees!helpdesk_tickets_assigned_to_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return jsonResponse(data || []);
    }

    // GET /:id - Get single ticket
    if (req.method === 'GET' && subPath.length === 1) {
      const id = subPath[0];
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select(`
          *,
          employee:employees!helpdesk_tickets_employee_id_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url),
          assigned:employees!helpdesk_tickets_assigned_to_fkey(id, employee_id, user_id, first_name, last_name, email, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return jsonResponse(data);
    }

    // POST / - Create ticket
    if (req.method === 'POST' && subPath.length === 0) {
      const body = await req.json();
      
      // Get employee ID for current user if not provided
      let employeeId = body.employee_id;
      if (!employeeId) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', auth.userId)
          .maybeSingle();
        
        if (employee) {
          employeeId = employee.id;
        }
      }

      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .insert({
          ...body,
          employee_id: employeeId
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PATCH /:id - Update ticket
    if (req.method === 'PATCH' && subPath.length === 1) {
      const id = subPath[0];
      const body = await req.json();
      
      const updateData: any = { ...body };
      if (body.status === 'resolved' && !body.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /:id - Delete ticket
    if (req.method === 'DELETE' && subPath.length === 1) {
      const id = subPath[0];
      const { error } = await supabase
        .from('helpdesk_tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // GET /:ticketId/messages - Get messages for a ticket
    if (req.method === 'GET' && subPath.length === 2 && subPath[1] === 'messages') {
      const ticketId = subPath[0];
      
      // Verify access to ticket
      const { data: ticket } = await supabase
        .from('helpdesk_tickets')
        .select('employee_id')
        .eq('id', ticketId)
        .single();

      if (!ticket) {
        return errorResponse('Ticket not found', 404);
      }

      // Get employee ID for current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      const isAdminOrHR = auth.role === 'admin' || auth.role === 'hr';
      
      // Check access - must be ticket owner or admin/hr
      if (!isAdminOrHR && employee?.id !== ticket.employee_id) {
        return errorResponse('Access denied', 403);
      }

      let query = supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:employees!ticket_messages_sender_id_fkey(id, employee_id, user_id, first_name, last_name, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      // Non-admin users can't see internal messages
      if (!isAdminOrHR) {
        query = query.eq('is_internal', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return jsonResponse(data || []);
    }

    // POST /:ticketId/messages - Send message to ticket
    if (req.method === 'POST' && subPath.length === 2 && subPath[1] === 'messages') {
      const ticketId = subPath[0];
      const body = await req.json();
      
      // Get employee ID for current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (!employee) {
        return errorResponse('Employee not found', 404);
      }

      // Verify access to ticket
      const { data: ticket } = await supabase
        .from('helpdesk_tickets')
        .select('employee_id')
        .eq('id', ticketId)
        .single();

      if (!ticket) {
        return errorResponse('Ticket not found', 404);
      }

      const isAdminOrHR = auth.role === 'admin' || auth.role === 'hr';
      
      // Check access - must be ticket owner or admin/hr
      if (!isAdminOrHR && employee.id !== ticket.employee_id) {
        return errorResponse('Access denied', 403);
      }

      // Non-admin users can't send internal messages
      const isInternal = isAdminOrHR ? (body.is_internal || false) : false;

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: employee.id,
          message: body.message,
          is_internal: isInternal,
        })
        .select()
        .single();

      if (error) throw error;

      // Update ticket updated_at
      await supabase
        .from('helpdesk_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return jsonResponse(data, 201);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Helpdesk API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
