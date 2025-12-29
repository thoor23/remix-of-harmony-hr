import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/api-stores", "");
    
    console.log(`[api-stores] ${req.method} ${path}`);

    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      console.error("[api-stores] Auth failed");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, role: userRole } = authResult;

    // Create service client for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper to check if user is admin/HR
    const isAdminOrHR = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      return data?.role === "admin" || data?.role === "hr";
    };

    // Helper to get employee ID for current user
    const getEmployeeId = async () => {
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", userId)
        .single();
      return data?.id;
    };

    // GET /stores - Get all stores
    if (req.method === "GET" && (path === "" || path === "/")) {
      const isAdmin = await isAdminOrHR();
      
      let query = supabase
        .from("stores")
        .select(`
          *,
          manager:employees!stores_manager_id_fkey(id, first_name, last_name, employee_id)
        `)
        .order("name");

      if (!isAdmin) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[api-stores] Error fetching stores:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get employee count for each store
      const { data: assignments } = await supabase
        .from("employee_store_assignments")
        .select("store_id")
        .eq("is_active", true);

      const storeCounts: Record<string, number> = {};
      assignments?.forEach((a: any) => {
        storeCounts[a.store_id] = (storeCounts[a.store_id] || 0) + 1;
      });

      const storesWithCounts = data?.map((store: any) => ({
        ...store,
        employee_count: storeCounts[store.id] || 0,
      }));

      return new Response(JSON.stringify(storesWithCounts), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /stores/:id - Get single store
    if (req.method === "GET" && path.match(/^\/[a-f0-9-]+$/)) {
      const storeId = path.slice(1);
      
      const { data, error } = await supabase
        .from("stores")
        .select(`
          *,
          manager:employees!stores_manager_id_fkey(id, first_name, last_name, employee_id, email)
        `)
        .eq("id", storeId)
        .single();

      if (error) {
        console.error("[api-stores] Error fetching store:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === "PGRST116" ? 404 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /stores/:id/employees - Get employees assigned to a store
    if (req.method === "GET" && path.match(/^\/[a-f0-9-]+\/employees$/)) {
      const storeId = path.split("/")[1];
      
      const { data, error } = await supabase
        .from("employee_store_assignments")
        .select(`
          *,
          employee:employees(
            id, first_name, last_name, employee_id, email, phone, status,
            department:departments(id, name),
            designation:designations(id, name)
          )
        `)
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (error) {
        console.error("[api-stores] Error fetching store employees:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /stores - Create new store
    if (req.method === "POST" && (path === "" || path === "/")) {
      const isAdmin = await isAdminOrHR();
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      console.log("[api-stores] Creating store:", body);

      const { data, error } = await supabase
        .from("stores")
        .insert({
          name: body.name,
          code: body.code,
          address_street: body.address_street,
          address_city: body.address_city,
          address_state: body.address_state,
          address_zip_code: body.address_zip_code,
          address_country: body.address_country,
          phone: body.phone,
          email: body.email,
          manager_id: body.manager_id || null,
          opening_time: body.opening_time,
          closing_time: body.closing_time,
          is_active: body.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error("[api-stores] Error creating store:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If manager is assigned, also assign store_manager role
      if (body.manager_id) {
        const { data: employee } = await supabase
          .from("employees")
          .select("user_id")
          .eq("id", body.manager_id)
          .single();

        if (employee?.user_id) {
          await supabase
            .from("user_roles")
            .upsert({
              user_id: employee.user_id,
              role: "store_manager",
            }, { onConflict: "user_id,role" });
        }
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /stores/:id - Update store
    if (req.method === "PUT" && path.match(/^\/[a-f0-9-]+$/)) {
      const isAdmin = await isAdminOrHR();
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const storeId = path.slice(1);
      const body = await req.json();
      console.log("[api-stores] Updating store:", storeId, body);

      const { data, error } = await supabase
        .from("stores")
        .update({
          name: body.name,
          code: body.code,
          address_street: body.address_street,
          address_city: body.address_city,
          address_state: body.address_state,
          address_zip_code: body.address_zip_code,
          address_country: body.address_country,
          phone: body.phone,
          email: body.email,
          manager_id: body.manager_id || null,
          opening_time: body.opening_time,
          closing_time: body.closing_time,
          is_active: body.is_active,
        })
        .eq("id", storeId)
        .select()
        .single();

      if (error) {
        console.error("[api-stores] Error updating store:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /stores/:id - Delete store
    if (req.method === "DELETE" && path.match(/^\/[a-f0-9-]+$/)) {
      const isAdmin = await isAdminOrHR();
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const storeId = path.slice(1);
      console.log("[api-stores] Deleting store:", storeId);

      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeId);

      if (error) {
        console.error("[api-stores] Error deleting store:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /stores/:id/assignments - Assign employee to store
    if (req.method === "POST" && path.match(/^\/[a-f0-9-]+\/assignments$/)) {
      const isAdmin = await isAdminOrHR();
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const storeId = path.split("/")[1];
      const body = await req.json();
      console.log("[api-stores] Assigning employee to store:", storeId, body);

      // If this is marked as primary, unset other primary assignments for this employee
      if (body.is_primary) {
        await supabase
          .from("employee_store_assignments")
          .update({ is_primary: false })
          .eq("employee_id", body.employee_id);
      }

      const { data, error } = await supabase
        .from("employee_store_assignments")
        .upsert({
          employee_id: body.employee_id,
          store_id: storeId,
          is_primary: body.is_primary ?? false,
          is_active: true,
          start_date: body.start_date || new Date().toISOString().split("T")[0],
          end_date: body.end_date || null,
        }, { onConflict: "employee_id,store_id" })
        .select()
        .single();

      if (error) {
        console.error("[api-stores] Error assigning employee:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update employee's primary_store_id if this is primary
      if (body.is_primary) {
        await supabase
          .from("employees")
          .update({ primary_store_id: storeId })
          .eq("id", body.employee_id);
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /stores/:id/assignments/:employeeId - Remove employee from store
    if (req.method === "DELETE" && path.match(/^\/[a-f0-9-]+\/assignments\/[a-f0-9-]+$/)) {
      const isAdmin = await isAdminOrHR();
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parts = path.split("/");
      const storeId = parts[1];
      const employeeId = parts[3];
      console.log("[api-stores] Removing employee from store:", storeId, employeeId);

      const { error } = await supabase
        .from("employee_store_assignments")
        .update({ is_active: false, end_date: new Date().toISOString().split("T")[0] })
        .eq("store_id", storeId)
        .eq("employee_id", employeeId);

      if (error) {
        console.error("[api-stores] Error removing employee:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /my-stores - Get stores for current employee
    if (req.method === "GET" && path === "/my-stores") {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        return new Response(JSON.stringify({ error: "Employee not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("employee_store_assignments")
        .select(`
          *,
          store:stores(*)
        `)
        .eq("employee_id", employeeId)
        .eq("is_active", true);

      if (error) {
        console.error("[api-stores] Error fetching my stores:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /transfers - Create employee transfer
    if (req.method === "POST" && path === "/transfers") {
      const isAdmin = await isAdminOrHR();
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      console.log("[api-stores] Creating transfer:", body);

      const initiatorId = await getEmployeeId();

      // Get current store assignment
      const { data: currentAssignment } = await supabase
        .from("employee_store_assignments")
        .select("store_id")
        .eq("employee_id", body.employee_id)
        .eq("is_primary", true)
        .eq("is_active", true)
        .single();

      // Create transfer record
      const { data: transfer, error: transferError } = await supabase
        .from("employee_transfers")
        .insert({
          employee_id: body.employee_id,
          from_store_id: currentAssignment?.store_id || null,
          to_store_id: body.to_store_id,
          effective_date: body.effective_date,
          reason: body.reason,
          notes: body.notes,
          initiated_by: initiatorId,
        })
        .select()
        .single();

      if (transferError) {
        console.error("[api-stores] Error creating transfer:", transferError);
        return new Response(JSON.stringify({ error: transferError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deactivate old primary assignment
      if (currentAssignment?.store_id) {
        await supabase
          .from("employee_store_assignments")
          .update({ 
            is_active: false, 
            is_primary: false,
            end_date: body.effective_date 
          })
          .eq("employee_id", body.employee_id)
          .eq("store_id", currentAssignment.store_id)
          .eq("is_primary", true);
      }

      // Create new primary assignment
      await supabase
        .from("employee_store_assignments")
        .upsert({
          employee_id: body.employee_id,
          store_id: body.to_store_id,
          is_primary: true,
          is_active: true,
          start_date: body.effective_date,
        }, { onConflict: "employee_id,store_id" });

      // Update employee's primary_store_id
      await supabase
        .from("employees")
        .update({ primary_store_id: body.to_store_id })
        .eq("id", body.employee_id);

      return new Response(JSON.stringify(transfer), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /transfers - Get all transfers
    if (req.method === "GET" && path === "/transfers") {
      const employeeId = url.searchParams.get("employee_id");
      const storeId = url.searchParams.get("store_id");

      let query = supabase
        .from("employee_transfers")
        .select(`
          *,
          employee:employees!employee_transfers_employee_id_fkey(id, first_name, last_name, employee_id),
          from_store:stores!employee_transfers_from_store_id_fkey(id, name, code),
          to_store:stores!employee_transfers_to_store_id_fkey(id, name, code),
          initiated_by_employee:employees!employee_transfers_initiated_by_fkey(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }
      if (storeId) {
        query = query.or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[api-stores] Error fetching transfers:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /transfers/:id - Get single transfer
    if (req.method === "GET" && path.match(/^\/transfers\/[a-f0-9-]+$/)) {
      const transferId = path.split("/")[2];
      
      const { data, error } = await supabase
        .from("employee_transfers")
        .select(`
          *,
          employee:employees!employee_transfers_employee_id_fkey(id, first_name, last_name, employee_id),
          from_store:stores!employee_transfers_from_store_id_fkey(id, name, code),
          to_store:stores!employee_transfers_to_store_id_fkey(id, name, code),
          initiated_by_employee:employees!employee_transfers_initiated_by_fkey(id, first_name, last_name)
        `)
        .eq("id", transferId)
        .single();

      if (error) {
        console.error("[api-stores] Error fetching transfer:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === "PGRST116" ? 404 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api-stores] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
