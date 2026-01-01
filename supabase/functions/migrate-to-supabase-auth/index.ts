import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    // Get all users from custom users table
    const { data: customUsers, error: fetchError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        company_id,
        is_active,
        created_at
      `);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${customUsers?.length || 0} users to migrate`);

    const results = {
      success: [] as string[],
      failed: [] as { email: string; error: string }[],
      skipped: [] as string[],
    };

    for (const user of customUsers || []) {
      try {
        console.log(`Migrating user: ${user.email}`);

        // Get user's role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, role_id')
          .eq('user_id', user.id)
          .single();

        // Get employee data
        const { data: employee } = await supabase
          .from('employees')
          .select('id, first_name, last_name, phone, avatar_url, company_id')
          .eq('user_id', user.id)
          .single();

        // Check if super admin
        const { data: superAdmin } = await supabase
          .from('super_admins')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // Create user in Supabase Auth with password Test@123
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'Test@123',
          email_confirm: true,
          user_metadata: {
            first_name: employee?.first_name || '',
            last_name: employee?.last_name || '',
          },
        });

        if (createError) {
          // Check if user already exists
          if (createError.message.includes('already been registered')) {
            console.log(`User ${user.email} already exists in auth.users, skipping`);
            results.skipped.push(user.email);
            continue;
          }
          throw createError;
        }

        const newUserId = authUser.user.id;
        console.log(`Created auth user: ${newUserId} for ${user.email}`);

        // Create profile linked to auth.users
        const companyId = user.company_id || employee?.company_id;
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: newUserId,
            email: user.email,
            first_name: employee?.first_name || null,
            last_name: employee?.last_name || null,
            phone: employee?.phone || null,
            avatar_url: employee?.avatar_url || null,
            company_id: companyId,
          }, { onConflict: 'id' });

        if (profileError) {
          console.error(`Profile creation error for ${user.email}:`, profileError);
        }

        // Create/update user_roles with new auth user ID
        if (roleData) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: newUserId,
              role: roleData.role,
              role_id: roleData.role_id,
            }, { onConflict: 'user_id' });

          if (roleError) {
            console.error(`Role assignment error for ${user.email}:`, roleError);
          }
        }

        // Update employees table with new auth user ID
        if (employee) {
          const { error: employeeError } = await supabase
            .from('employees')
            .update({ user_id: newUserId })
            .eq('id', employee.id);

          if (employeeError) {
            console.error(`Employee update error for ${user.email}:`, employeeError);
          }
        }

        // Update super_admins if applicable
        if (superAdmin) {
          const { error: saError } = await supabase
            .from('super_admins')
            .update({ user_id: newUserId })
            .eq('id', superAdmin.id);

          if (saError) {
            console.error(`Super admin update error for ${user.email}:`, saError);
          }
        }

        results.success.push(user.email);
        console.log(`Successfully migrated: ${user.email}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to migrate ${user.email}:`, errorMessage);
        results.failed.push({ email: user.email, error: errorMessage });
      }
    }

    console.log('Migration complete:', results);

    return new Response(
      JSON.stringify({
        message: 'Migration complete',
        summary: {
          total: customUsers?.length || 0,
          success: results.success.length,
          failed: results.failed.length,
          skipped: results.skipped.length,
        },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
