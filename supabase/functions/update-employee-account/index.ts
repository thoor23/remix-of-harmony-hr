import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", requestingUser.id);

    // Check if requesting user has admin or hr role
    const { data: userRoles, error: rolesError } = await supabase
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

    const { employee_id, user_id, profile, role, role_id, status, password } = body;

    if (!employee_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "employee_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password using Supabase Auth Admin API if provided
    if (password && password.length >= 6) {
      console.log("Updating password for user:", user_id);
      const { error: passwordError } = await supabase.auth.admin.updateUserById(user_id, {
        password: password,
      });

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
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
        })
        .eq("id", user_id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return new Response(
          JSON.stringify({ error: `Failed to update profile: ${profileError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Profile updated successfully");

      // Also update email in auth.users if it changed
      if (profile.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(user_id, {
          email: profile.email.toLowerCase(),
        });

        if (emailError) {
          console.error("Email update error in auth.users:", emailError);
          // Don't fail the request, just log the error
        } else {
          console.log("Email updated in auth.users");
        }
      }

      // Update employees table as well
      const { error: employeeUpdateError } = await supabase
        .from("employees")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
        })
        .eq("id", employee_id);

      if (employeeUpdateError) {
        console.error("Employee update error:", employeeUpdateError);
      }
    }

    // Update employee status if provided
    if (status) {
      console.log("Updating employee status:", status);
      const { error: statusError } = await supabase
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

      // Also update user's active status in auth
      const { error: banError } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: status === "inactive" ? "876000h" : "none", // 100 years ban or unban
      });

      if (banError) {
        console.error("User ban/unban error:", banError);
      } else {
        console.log("User active status updated:", status === "active" ? "unbanned" : "banned");
      }
    }

    // Update role if role or role_id is provided
    if (role || role_id) {
      console.log("Updating role for user:", user_id, "role_type:", role, "role_id:", role_id);
      
      // Build update object with both role (enum) and role_id (UUID)
      const roleUpdate: { role?: string; role_id?: string } = {};
      if (role) roleUpdate.role = role;
      if (role_id) roleUpdate.role_id = role_id;

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id,
          ...roleUpdate,
        }, { onConflict: 'user_id' });

      if (roleError) {
        console.error("Role update error:", roleError);
        return new Response(
          JSON.stringify({ error: `Failed to update role: ${roleError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
