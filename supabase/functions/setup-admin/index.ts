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
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { email, password, setupKey } = await req.json();

    // Simple protection - require a setup key
    if (setupKey !== 'initial-setup-2024') {
      return errorResponse('Invalid setup key', 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Update the user's password
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;

    console.log(`[setup-admin] Password set for: ${email}`);

    return jsonResponse({ success: true, message: `Password set for ${email}` });
  } catch (error: unknown) {
    console.error('[setup-admin] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});
