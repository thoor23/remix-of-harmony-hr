import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  employee_data: {
    employee_id: string;
    date_of_birth?: string;
    date_of_joining: string;
    department_id?: string;
    designation_id?: string;
    employment_type: string;
    reporting_to?: string;
    address_street?: string;
    address_city?: string;
    address_state?: string;
    address_zip_code?: string;
    address_country?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    bank_name?: string;
    bank_account_holder_name?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
  };
  role?: "admin" | "hr" | "manager" | "employee";
  company_id?: string;
}

Deno.serve(async (req) => {
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

    // Verify the requesting user has permission
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
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", requestingUser.id);

    // Check if requesting user has admin, hr, or manager role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .maybeSingle();

    if (roleError) {
      console.error("Failed to verify permissions:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["admin", "hr", "manager"];
    if (!roleData || !allowedRoles.includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company_id from requesting user's profile
    const { data: requestingProfile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", requestingUser.id)
      .single();

    const body: CreateEmployeeRequest = await req.json();
    const { email, password, first_name, last_name, phone, employee_data, role = "employee", company_id } = body;

    // Use provided company_id or fall back to requesting user's company
    const targetCompanyId = company_id || requestingProfile?.company_id;

    if (!targetCompanyId) {
      return new Response(
        JSON.stringify({ error: "Company context required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !employee_data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (createUserError || !authData.user) {
      console.error("Failed to create auth user:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError?.message || "Failed to create user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    console.log("Created auth user:", userId);

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        first_name,
        last_name,
        email: email.toLowerCase(),
        phone: phone || null,
        company_id: targetCompanyId,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create employee record
    const { data: employeeResult, error: employeeError } = await supabase
      .from("employees")
      .insert({
        user_id: userId,
        first_name,
        last_name,
        email: email.toLowerCase(),
        phone: phone || null,
        employee_id: employee_data.employee_id,
        company_id: targetCompanyId,
        date_of_birth: employee_data.date_of_birth || null,
        date_of_joining: employee_data.date_of_joining,
        department_id: employee_data.department_id || null,
        designation_id: employee_data.designation_id || null,
        employment_type: employee_data.employment_type,
        reporting_to: employee_data.reporting_to || null,
        address_street: employee_data.address_street || null,
        address_city: employee_data.address_city || null,
        address_state: employee_data.address_state || null,
        address_zip_code: employee_data.address_zip_code || null,
        address_country: employee_data.address_country || null,
        emergency_contact_name: employee_data.emergency_contact_name || null,
        emergency_contact_relationship: employee_data.emergency_contact_relationship || null,
        emergency_contact_phone: employee_data.emergency_contact_phone || null,
        bank_name: employee_data.bank_name || null,
        bank_account_holder_name: employee_data.bank_account_holder_name || null,
        bank_account_number: employee_data.bank_account_number || null,
        bank_ifsc_code: employee_data.bank_ifsc_code || null,
      })
      .select()
      .single();

    if (employeeError) {
      console.error("Failed to create employee:", employeeError);
      // Rollback: delete the profile and auth user
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Failed to create employee: ${employeeError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign role
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: role,
      }, { onConflict: 'user_id' });

    if (roleInsertError) {
      console.error("Failed to assign role:", roleInsertError);
      // Don't rollback for role assignment failure - employee is already created
    }

    console.log("Employee account created successfully:", {
      user_id: userId,
      employee_id: employeeResult.id,
      role: role,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        employee_id: employeeResult.id,
        message: "Employee account created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
