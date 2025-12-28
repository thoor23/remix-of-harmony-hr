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

    const templateType = subPath[0]; // letters, emails, announcements, payslips, banners
    const templateId = subPath[1];

    // Map template type to table name
    const tableMap: Record<string, string> = {
      'letters': 'letter_templates',
      'emails': 'email_templates',
      'announcements': 'announcement_templates',
      'payslips': 'payslip_templates',
      'banners': 'announcement_banner_templates'
    };

    const tableName = tableMap[templateType];
    if (!tableName) {
      return errorResponse('Invalid template type', 400);
    }

    // GET /type - List templates
    if (req.method === 'GET' && !templateId) {
      const type = url.searchParams.get('type');
      let query = supabase.from(tableName).select('*').order('created_at', { ascending: false });
      
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /type/:id - Get single template
    if (req.method === 'GET' && templateId) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /type - Create template
    if (req.method === 'POST' && !templateId) {
      const body = await req.json();
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          ...body,
          created_by: auth.userId
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // PUT /type/:id - Update template
    if (req.method === 'PUT' && templateId) {
      const body = await req.json();
      const { data, error } = await supabase
        .from(tableName)
        .update(body)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // DELETE /type/:id - Delete template
    if (req.method === 'DELETE' && templateId) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // POST /type/:id/set-default - Set template as default
    if (req.method === 'POST' && subPath[2] === 'set-default') {
      // First, unset all defaults for this type
      const { data: template } = await supabase
        .from(tableName)
        .select('type')
        .eq('id', templateId)
        .single();

      if (template?.type) {
        await supabase
          .from(tableName)
          .update({ is_default: false })
          .eq('type', template.type);
      }

      // Set this template as default
      const { data, error } = await supabase
        .from(tableName)
        .update({ is_default: true })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data);
    }

    // GET /type/default/:letterType - Get default template by type
    if (req.method === 'GET' && subPath[1] === 'default' && subPath[2]) {
      const letterType = subPath[2];
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('type', letterType)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return jsonResponse(data);
    }

    // POST /generated-letters - Create generated letter
    if (req.method === 'POST' && templateType === 'generated-letters') {
      const body = await req.json();
      const { data, error } = await supabase
        .from('generated_letters')
        .insert({
          ...body,
          generated_by: auth.userId
        })
        .select()
        .single();

      if (error) throw error;
      return jsonResponse(data, 201);
    }

    // GET /generated-letters - List generated letters
    if (req.method === 'GET' && templateType === 'generated-letters') {
      const type = url.searchParams.get('type');
      const employeeId = url.searchParams.get('employee_id');
      
      let query = supabase
        .from('generated_letters')
        .select(`
          *,
          employee:employees(id, employee_id, user_id, profiles:user_id(first_name, last_name)),
          template:letter_templates(id, name)
        `)
        .order('generated_at', { ascending: false });

      if (type) query = query.eq('type', type);
      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data);
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('Templates API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
