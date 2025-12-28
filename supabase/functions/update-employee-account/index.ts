import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UpdateEmployeeRequest {
  employee_id: string; // The UUID of the employee record
  user_id: string; // The UUID of the auth user
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  role?: "admin" | "hr" | "manager" | "employee";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create client with user's auth token to verify permissions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Requesting user:", requestingUser.id);

    // Check if requesting user has admin or hr role
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

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

    // Parse request body
    const body: UpdateEmployeeRequest = await req.json();
    console.log("Request body:", { ...body, password: body.password ? "[REDACTED]" : undefined });

    const { employee_id, user_id, profile, role, status, password } = body;

    if (!employee_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "employee_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password if provided
    if (password && password.length >= 6) {
      console.log("Updating password for user:", user_id);
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { password }
      );

      if (passwordError) {
        console.error("Password update error:", passwordError);
        return new Response(
          JSON.stringify({ error: `Failed to update password: ${passwordError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Password updated successfully");
    }

    // Update profile if provided
    if (profile) {
      console.log("Updating profile for user:", user_id);
      const { error: profileError } = await supabaseAdmin
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
    }

    // Update employee status if provided
    if (status) {
      console.log("Updating employee status:", status);
      const { error: statusError } = await supabaseAdmin
        .from("employees")
        .update({ status })
        .eq("id", employee_id);

      if (statusError) {
        console.error("Status update error:", statusError);
        return new Response(
          JSON.stringify({ error: `Failed to update status: ${statusError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Status updated successfully");
    }

    // Update role if provided
    if (role) {
      console.log("Updating role for user:", user_id, "to:", role);
      
      // Check if user already has a role
      const { data: existingRole, error: checkError } = await supabaseAdmin
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

      if (existingRole) {
        // Update existing role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .update({ role })
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
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id, role });

        if (roleError) {
          console.error("Role insert error:", roleError);
          return new Response(
            JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      console.log("Role updated successfully");
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
