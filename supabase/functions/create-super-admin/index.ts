import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

// Password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { email, password, setupKey } = await req.json();

    // Simple protection - require a setup key
    if (setupKey !== 'super-admin-setup-2024') {
      return errorResponse('Invalid setup key', 403);
    }

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`[create-super-admin] User already exists: ${email}`);
    } else {
      // Get default company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();

      if (!company) {
        return errorResponse('No company found. Please create a company first.', 400);
      }

      // Hash the password
      const passwordHash = await hashPassword(password);

      // Create the user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          company_id: company.id,
          is_active: true,
          email_confirmed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) throw userError;
      userId = newUser.id;
      console.log(`[create-super-admin] Created user: ${email}`);
    }

    // Check if already a super admin
    const { data: existingSuperAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSuperAdmin) {
      return jsonResponse({ 
        success: true, 
        message: `${email} is already a super admin`,
        userId 
      });
    }

    // Add to super_admins table
    const { error: superAdminError } = await supabase
      .from('super_admins')
      .insert({ user_id: userId });

    if (superAdminError) throw superAdminError;

    console.log(`[create-super-admin] Added super admin: ${email}`);

    return jsonResponse({ 
      success: true, 
      message: `Super admin created successfully for ${email}`,
      userId 
    });
  } catch (error: unknown) {
    console.error('[create-super-admin] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
