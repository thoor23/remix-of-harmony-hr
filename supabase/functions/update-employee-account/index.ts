import { authenticateRequest, hashPassword, getSupabaseClient, getRequestCompanyId } from "../_shared/auth.ts";

interface UpdateEmployeeRequest {
  employee_id: string; // The UUID of the employee record
  user_id: string; // The UUID of the user
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  role?: string; // role_type from roles table (admin/employee)
  role_id?: string; // UUID of the role from roles table
  status?: "active" | "inactive";
  password?: string; // Optional - only update if provided
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // Verify the requesting user using custom auth
    const auth = await authenticateRequest(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", auth.userId, "role:", auth.role);

    // Check if requesting user has admin or hr role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.userId);

    if (rolesError) {
      console.error("Roles error:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roles = userRoles?.map((r) => r.role) || [];
    console.log("User roles:", roles);

    if (!roles.includes("admin") && !roles.includes("hr")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Admin or HR role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company ID for this request
    const url = new URL(req.url);
    const companyId = getRequestCompanyId(url, auth);

    // Parse request body
    const body: UpdateEmployeeRequest = await req.json();
    console.log("Request body:", { ...body, password: body.password ? "[REDACTED]" : undefined });

    const { employee_id, user_id, profile, role, role_id, status, password } = body;

    if (!employee_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "employee_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password in users table if provided
    if (password && password.length >= 6) {
      console.log("Updating password for user:", user_id);
      const passwordHash = await hashPassword(password);
      const { error: passwordError } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("id", user_id);

      if (passwordError) {
        console.error("Password update error:", passwordError);
        return new Response(
          JSON.stringify({ error: `Failed to update password: ${passwordError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Password updated successfully in users table");
    }

    // Update profile if provided
    if (profile) {
      console.log("Updating profile for user:", user_id);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
        })
        .eq("user_id", user_id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return new Response(
          JSON.stringify({ error: `Failed to update profile: ${profileError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Profile updated successfully");

      // Also update email in users table if it changed
      if (profile.email) {
        const { error: emailError } = await supabase
          .from("users")
          .update({ email: profile.email.toLowerCase() })
          .eq("id", user_id);

        if (emailError) {
          console.error("Email update error in users table:", emailError);
          // Don't fail the request, just log the error
        } else {
          console.log("Email updated in users table");
        }
      }
    }

    // Update employee status if provided
    if (status) {
      console.log("Updating employee status:", status);
      let query = supabase
        .from("employees")
        .update({ status })
        .eq("id", employee_id);
      
      // Add company filter if available
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { error: statusError } = await query;

      if (statusError) {
        console.error("Status update error:", statusError);
        return new Response(
          JSON.stringify({ error: `Failed to update status: ${statusError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Status updated successfully");

      // Also update is_active in users table based on status
      const isActive = status === "active";
      const { error: activeError } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", user_id);

      if (activeError) {
        console.error("is_active update error in users table:", activeError);
      } else {
        console.log("is_active updated in users table:", isActive);
      }
    }

    // Update role if role or role_id is provided
    if (role || role_id) {
      console.log("Updating role for user:", user_id, "role_type:", role, "role_id:", role_id);
      
      // Check if user already has a role
      const { data: existingRole, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (checkError) {
        console.error("Role check error:", checkError);
        return new Response(
          JSON.stringify({ error: `Failed to check existing role: ${checkError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build update object with both role (enum) and role_id (UUID)
      const roleUpdate: { role?: string; role_id?: string } = {};
      if (role) roleUpdate.role = role;
      if (role_id) roleUpdate.role_id = role_id;

      if (existingRole) {
        // Update existing role
        const { error: roleError } = await supabase
          .from("user_roles")
          .update(roleUpdate)
          .eq("user_id", user_id);

        if (roleError) {
          console.error("Role update error:", roleError);
          return new Response(
            JSON.stringify({ error: `Failed to update role: ${roleError.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Insert new role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id, ...roleUpdate });

        if (roleError) {
          console.error("Role insert error:", roleError);
          return new Response(
            JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      console.log("Role updated successfully with role_type:", role, "role_id:", role_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Employee account updated successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
