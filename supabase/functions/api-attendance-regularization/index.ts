import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, getRequestCompanyId, withCompanyId } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const path = url.pathname.replace("/api-attendance-regularization", "");
    const companyId = await getRequestCompanyId(url, user);

    // Get user's employee record
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.userId)
      .eq("company_id", companyId)
      .maybeSingle();

    const isAdmin = ["admin", "hr"].includes(user.role);

    // GET /my - Get current user's requests
    if (req.method === "GET" && path === "/my") {
      if (!employee) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("attendance_regularization_requests")
        .select(`*, attendance:attendance_records(date, check_in, check_out, status), reviewer:reviewed_by(employee_id, user_id)`)
        .eq("employee_id", employee.id)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET / - Get all requests (admin only)
    if (req.method === "GET" && (path === "" || path === "/")) {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const status = url.searchParams.get("status");
      let query = supabase
        .from("attendance_regularization_requests")
        .select(`*, employee:employee_id(id, employee_id, user_id, department:department_id(name), designation:designation_id(name)), attendance:attendance_records(date, check_in, check_out, status)`)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST / - Create new request
    if (req.method === "POST" && (path === "" || path === "/")) {
      if (!employee) {
        return new Response(JSON.stringify({ error: "Employee not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { request_date, request_type, attendance_id, requested_check_in, requested_check_out, reason } = body;

      let originalCheckIn = null;
      let originalCheckOut = null;
      if (attendance_id) {
        const { data: attendance } = await supabase
          .from("attendance_records")
          .select("check_in, check_out")
          .eq("id", attendance_id)
          .eq("company_id", companyId)
          .maybeSingle();
        if (attendance) {
          originalCheckIn = attendance.check_in;
          originalCheckOut = attendance.check_out;
        }
      }

      const { data, error } = await supabase
        .from("attendance_regularization_requests")
        .insert(withCompanyId({
          employee_id: employee.id,
          attendance_id,
          request_date,
          request_type: request_type || "correction",
          original_check_in: originalCheckIn,
          original_check_out: originalCheckOut,
          requested_check_in,
          requested_check_out,
          reason,
        }, companyId))
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH /:id - Review request (admin only)
    const idMatch = path.match(/^\/([a-f0-9-]+)$/);
    if (req.method === "PATCH" && idMatch) {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const requestId = idMatch[1];
      const body = await req.json();
      const { status, review_comments } = body;

      const { data: request } = await supabase
        .from("attendance_regularization_requests")
        .select("*")
        .eq("id", requestId)
        .eq("company_id", companyId)
        .single();

      if (!request) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("attendance_regularization_requests")
        .update({ status, review_comments, reviewed_by: employee?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;

      if (status === "approved") {
        if (request.attendance_id) {
          await supabase
            .from("attendance_records")
            .update({ check_in: request.requested_check_in, check_out: request.requested_check_out, status: "present", notes: `Regularized: ${request.reason}` })
            .eq("id", request.attendance_id)
            .eq("company_id", companyId);
        } else {
          await supabase
            .from("attendance_records")
            .insert(withCompanyId({ employee_id: request.employee_id, date: request.request_date, check_in: request.requested_check_in, check_out: request.requested_check_out, status: "present", notes: `Created via regularization: ${request.reason}` }, companyId));
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[api-attendance-regularization] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
