import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceItem {
  category_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  expense_claim_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdminOrHR = roleData?.role === 'admin' || roleData?.role === 'hr';

    // Get employee record
    const { data: employeeData } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const url = new URL(req.url);
    const pathname = url.pathname.replace('/api-internal-invoices', '');
    const method = req.method;

    console.log(`[api-internal-invoices] ${method} ${pathname}`);

    // CATEGORIES ENDPOINTS
    if (pathname === '/categories' || pathname.startsWith('/categories/')) {
      const categoryId = pathname.split('/')[2];

      // GET /categories - List all categories
      if (method === 'GET' && !categoryId) {
        const { data, error } = await supabase
          .from('internal_invoice_categories')
          .select('*')
          .order('name');

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /categories - Create category (admin/hr only)
      if (method === 'POST' && !categoryId) {
        if (!isAdminOrHR) {
          return new Response(
            JSON.stringify({ error: 'Admin or HR access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const { data, error } = await supabase
          .from('internal_invoice_categories')
          .insert(body)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /categories/:id - Update category
      if (method === 'PUT' && categoryId) {
        if (!isAdminOrHR) {
          return new Response(
            JSON.stringify({ error: 'Admin or HR access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const { data, error } = await supabase
          .from('internal_invoice_categories')
          .update(body)
          .eq('id', categoryId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /categories/:id - Delete category
      if (method === 'DELETE' && categoryId) {
        if (!isAdminOrHR) {
          return new Response(
            JSON.stringify({ error: 'Admin or HR access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('internal_invoice_categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // STATS ENDPOINT
    if (pathname === '/stats' && method === 'GET') {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get all invoices for stats
      const { data: invoices, error } = await supabase
        .from('internal_invoices')
        .select('id, status, total_amount, paid_at');

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const stats = {
        total_invoices: invoices?.length || 0,
        pending_amount: invoices?.filter(i => i.status === 'sent').reduce((sum, i) => sum + Number(i.total_amount), 0) || 0,
        paid_this_month: invoices?.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth).reduce((sum, i) => sum + Number(i.total_amount), 0) || 0,
        overdue_count: invoices?.filter(i => i.status === 'overdue').length || 0,
        draft_count: invoices?.filter(i => i.status === 'draft').length || 0,
        sent_count: invoices?.filter(i => i.status === 'sent').length || 0,
      };

      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PROCESS RECURRING ENDPOINT
    if (pathname === '/recurring/process' && method === 'POST') {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const today = new Date().toISOString().split('T')[0];

      // Get recurring invoices due for processing
      const { data: recurringInvoices, error: fetchError } = await supabase
        .from('internal_invoices')
        .select('*, internal_invoice_items(*)')
        .eq('is_recurring', true)
        .lte('next_recurring_date', today)
        .not('status', 'eq', 'cancelled');

      if (fetchError) throw fetchError;

      let processedCount = 0;

      for (const invoice of recurringInvoices || []) {
        // Calculate next recurring date
        const currentDate = new Date(invoice.next_recurring_date);
        let nextDate = new Date(currentDate);

        switch (invoice.recurring_frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Calculate new due date based on same offset
        const originalDueDiff = new Date(invoice.due_date).getTime() - new Date(invoice.invoice_date).getTime();
        const newInvoiceDate = invoice.next_recurring_date;
        const newDueDate = new Date(new Date(newInvoiceDate).getTime() + originalDueDiff).toISOString().split('T')[0];

        // Create new invoice
        const { data: newInvoice, error: createError } = await supabase
          .from('internal_invoices')
          .insert({
            from_location_id: invoice.from_location_id,
            to_location_id: invoice.to_location_id,
            invoice_type: invoice.invoice_type,
            invoice_date: newInvoiceDate,
            due_date: newDueDate,
            subtotal: invoice.subtotal,
            tax_rate: invoice.tax_rate,
            tax_amount: invoice.tax_amount,
            total_amount: invoice.total_amount,
            status: 'draft',
            notes: invoice.notes,
            is_recurring: false,
            parent_invoice_id: invoice.id,
            created_by: invoice.created_by,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating recurring invoice:', createError);
          continue;
        }

        // Copy line items
        if (invoice.internal_invoice_items?.length > 0) {
          const items = invoice.internal_invoice_items.map((item: InvoiceItem) => ({
            invoice_id: newInvoice.id,
            category_id: item.category_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
          }));

          await supabase.from('internal_invoice_items').insert(items);
        }

        // Update parent invoice next_recurring_date
        await supabase
          .from('internal_invoices')
          .update({ next_recurring_date: nextDate.toISOString().split('T')[0] })
          .eq('id', invoice.id);

        processedCount++;
      }

      return new Response(JSON.stringify({ processed: processedCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // INVOICES CRUD
    const invoiceId = pathname.split('/')[1];

    // GET / - List invoices
    if (method === 'GET' && !invoiceId) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase
        .from('internal_invoices')
        .select(`
          *,
          from_location:stores!internal_invoices_from_location_id_fkey(id, name, code, type),
          to_location:stores!internal_invoices_to_location_id_fkey(id, name, code, type),
          created_by_employee:employees!internal_invoices_created_by_fkey(id, first_name, last_name, employee_id)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      const status = url.searchParams.get('status');
      const fromLocationId = url.searchParams.get('from_location_id');
      const toLocationId = url.searchParams.get('to_location_id');
      const invoiceType = url.searchParams.get('invoice_type');

      if (status) query = query.eq('status', status);
      if (fromLocationId) query = query.eq('from_location_id', fromLocationId);
      if (toLocationId) query = query.eq('to_location_id', toLocationId);
      if (invoiceType) query = query.eq('invoice_type', invoiceType);

      const { data, error } = await query;

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /:id - Get single invoice with items
    if (method === 'GET' && invoiceId && !pathname.includes('/')) {
      const { data: invoice, error } = await supabase
        .from('internal_invoices')
        .select(`
          *,
          from_location:stores!internal_invoices_from_location_id_fkey(id, name, code, type, address_street, address_city, address_state, address_zip_code, phone, email),
          to_location:stores!internal_invoices_to_location_id_fkey(id, name, code, type, address_street, address_city, address_state, address_zip_code, phone, email),
          created_by_employee:employees!internal_invoices_created_by_fkey(id, first_name, last_name, employee_id),
          items:internal_invoice_items(*, category:internal_invoice_categories(*))
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(invoice), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST / - Create invoice
    if (method === 'POST' && !invoiceId) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { items, ...invoiceData } = body;

      // Calculate totals
      const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + (item.quantity * item.unit_price), 0);
      const taxRate = invoiceData.tax_rate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Set next recurring date if recurring
      let nextRecurringDate = null;
      if (invoiceData.is_recurring && invoiceData.recurring_frequency) {
        const startDate = new Date(invoiceData.invoice_date);
        switch (invoiceData.recurring_frequency) {
          case 'weekly':
            startDate.setDate(startDate.getDate() + 7);
            break;
          case 'monthly':
            startDate.setMonth(startDate.getMonth() + 1);
            break;
          case 'quarterly':
            startDate.setMonth(startDate.getMonth() + 3);
            break;
          case 'yearly':
            startDate.setFullYear(startDate.getFullYear() + 1);
            break;
        }
        nextRecurringDate = startDate.toISOString().split('T')[0];
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('internal_invoices')
        .insert({
          ...invoiceData,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          next_recurring_date: nextRecurringDate,
          created_by: employeeData?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      if (items && items.length > 0) {
        const lineItems = items.map((item: InvoiceItem) => ({
          invoice_id: invoice.id,
          category_id: item.category_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
          expense_claim_id: item.expense_claim_id || null,
        }));

        const { error: itemsError } = await supabase
          .from('internal_invoice_items')
          .insert(lineItems);

        if (itemsError) throw itemsError;
      }

      // Fetch complete invoice with items
      const { data: completeInvoice, error: fetchError } = await supabase
        .from('internal_invoices')
        .select(`
          *,
          from_location:stores!internal_invoices_from_location_id_fkey(id, name, code, type),
          to_location:stores!internal_invoices_to_location_id_fkey(id, name, code, type),
          items:internal_invoice_items(*, category:internal_invoice_categories(*))
        `)
        .eq('id', invoice.id)
        .single();

      if (fetchError) throw fetchError;

      return new Response(JSON.stringify(completeInvoice), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT /:id - Update invoice (only drafts)
    if (method === 'PUT' && invoiceId) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if invoice is draft
      const { data: existingInvoice } = await supabase
        .from('internal_invoices')
        .select('status')
        .eq('id', invoiceId)
        .single();

      if (existingInvoice?.status !== 'draft') {
        return new Response(
          JSON.stringify({ error: 'Only draft invoices can be edited' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { items, ...invoiceData } = body;

      // Calculate totals
      const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + (item.quantity * item.unit_price), 0);
      const taxRate = invoiceData.tax_rate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('internal_invoices')
        .update({
          ...invoiceData,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Delete existing items and create new ones
      await supabase.from('internal_invoice_items').delete().eq('invoice_id', invoiceId);

      if (items && items.length > 0) {
        const lineItems = items.map((item: InvoiceItem) => ({
          invoice_id: invoiceId,
          category_id: item.category_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
          expense_claim_id: item.expense_claim_id || null,
        }));

        await supabase.from('internal_invoice_items').insert(lineItems);
      }

      // Fetch updated invoice
      const { data: updatedInvoice, error: fetchError } = await supabase
        .from('internal_invoices')
        .select(`
          *,
          from_location:stores!internal_invoices_from_location_id_fkey(id, name, code, type),
          to_location:stores!internal_invoices_to_location_id_fkey(id, name, code, type),
          items:internal_invoice_items(*, category:internal_invoice_categories(*))
        `)
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      return new Response(JSON.stringify(updatedInvoice), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /:id - Delete invoice (only drafts)
    if (method === 'DELETE' && invoiceId) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if invoice is draft
      const { data: existingInvoice } = await supabase
        .from('internal_invoices')
        .select('status')
        .eq('id', invoiceId)
        .single();

      if (existingInvoice?.status !== 'draft') {
        return new Response(
          JSON.stringify({ error: 'Only draft invoices can be deleted' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('internal_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PATCH /:id/send - Mark as sent
    if (method === 'PATCH' && pathname.endsWith('/send')) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const id = pathname.split('/')[1];
      const { data, error } = await supabase
        .from('internal_invoices')
        .update({ status: 'sent' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PATCH /:id/pay - Mark as paid
    if (method === 'PATCH' && pathname.endsWith('/pay')) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const id = pathname.split('/')[1];
      const body = await req.json();

      const { data, error } = await supabase
        .from('internal_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: employeeData?.id,
          payment_reference: body.payment_reference || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PATCH /:id/cancel - Cancel invoice
    if (method === 'PATCH' && pathname.endsWith('/cancel')) {
      if (!isAdminOrHR) {
        return new Response(
          JSON.stringify({ error: 'Admin or HR access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const id = pathname.split('/')[1];
      const { data, error } = await supabase
        .from('internal_invoices')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[api-internal-invoices] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
