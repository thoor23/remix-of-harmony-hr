import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest } from "../_shared/auth.ts";
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

    // Get user's employee record
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.userId)
      .maybeSingle();

    // Check if admin/HR
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.userId)
      .maybeSingle();
    const isAdmin = userRole?.role === "admin" || userRole?.role === "hr";

    // GET /my - Get current user's requests
    if (req.method === "GET" && path === "/my") {
      if (!employee) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("attendance_regularization_requests")
        .select(`
          *,
          attendance:attendance_records(date, check_in, check_out, status),
          reviewer:reviewed_by(
            employee_id,
            user_id
          )
        `)
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get reviewer profiles
      const reviewerIds = data?.filter(r => r.reviewer?.user_id).map(r => r.reviewer.user_id) || [];
      let reviewerProfiles: Record<string, any> = {};
      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", reviewerIds);
        profiles?.forEach(p => {
          reviewerProfiles[p.user_id] = p;
        });
      }

      const enrichedData = data?.map(r => ({
        ...r,
        reviewer: r.reviewer ? {
          ...r.reviewer,
          profile: reviewerProfiles[r.reviewer.user_id] || null
        } : null
      }));

      return new Response(JSON.stringify(enrichedData), {
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
        .select(`
          *,
          employee:employee_id(
            id, employee_id, user_id,
            department:department_id(name),
            designation:designation_id(name)
          ),
          attendance:attendance_records(date, check_in, check_out, status)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get profiles for employees
      const userIds = data?.filter(r => r.employee?.user_id).map(r => r.employee.user_id) || [];
      let profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        profileData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      const enrichedData = data?.map(r => ({
        ...r,
        employee: r.employee ? {
          ...r.employee,
          profile: profiles[r.employee.user_id] || null
        } : null
      }));

      return new Response(JSON.stringify(enrichedData), {
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

      // Get original attendance if exists
      let originalCheckIn = null;
      let originalCheckOut = null;
      if (attendance_id) {
        const { data: attendance } = await supabase
          .from("attendance_records")
          .select("check_in, check_out")
          .eq("id", attendance_id)
          .maybeSingle();
        if (attendance) {
          originalCheckIn = attendance.check_in;
          originalCheckOut = attendance.check_out;
        }
      }

      const { data, error } = await supabase
        .from("attendance_regularization_requests")
        .insert({
          employee_id: employee.id,
          attendance_id,
          request_date,
          request_type: request_type || "correction",
          original_check_in: originalCheckIn,
          original_check_out: originalCheckOut,
          requested_check_in,
          requested_check_out,
          reason,
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[api-attendance-regularization] Created request for employee ${employee.id}`);

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

      // Get the request details
      const { data: request } = await supabase
        .from("attendance_regularization_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update the request
      const { data, error } = await supabase
        .from("attendance_regularization_requests")
        .update({
          status,
          review_comments,
          reviewed_by: employee?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      // If approved, update or create attendance record
      if (status === "approved") {
        if (request.attendance_id) {
          // Update existing attendance
          await supabase
            .from("attendance_records")
            .update({
              check_in: request.requested_check_in,
              check_out: request.requested_check_out,
              status: "present",
              notes: `Regularized: ${request.reason}`,
            })
            .eq("id", request.attendance_id);
        } else {
          // Create new attendance record
          await supabase
            .from("attendance_records")
            .insert({
              employee_id: request.employee_id,
              date: request.request_date,
              check_in: request.requested_check_in,
              check_out: request.requested_check_out,
              status: "present",
              notes: `Created via regularization: ${request.reason}`,
            });
        }
        console.log(`[api-attendance-regularization] Approved and applied regularization ${requestId}`);
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
