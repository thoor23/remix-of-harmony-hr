import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = 60 * 60 * 24; // 24 hours in seconds
const JWT_REFRESH_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days in seconds

// Create Supabase client with service role (bypasses RLS)
export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Simple JWT implementation using Web Crypto API
async function createHmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const decoded = atob(base64 + padding);
  return new Uint8Array([...decoded].map(c => c.charCodeAt(0)));
}

export async function generateToken(payload: Record<string, unknown>, expiresIn: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(tokenPayload)));
  const message = `${headerB64}.${payloadB64}`;

  const key = await createHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${message}.${signatureB64}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);

    const encoder = new TextEncoder();
    const key = await createHmacKey();
    const signatureBuffer = new Uint8Array(signature).buffer;
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(message));

    if (!isValid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function generateAccessToken(userId: string, email: string, role: string): Promise<string> {
  return generateToken({ userId, email, role, type: 'access' }, JWT_EXPIRES_IN);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return generateToken({ userId, type: 'refresh' }, JWT_REFRESH_EXPIRES_IN);
}

// Password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
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

export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;
    
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
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
    const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return computedHashHex === hashHex;
  } catch {
    return false;
  }
}

// Extract and verify token from request
export async function authenticateRequest(req: Request): Promise<{ userId: string; email: string; role: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  if (!payload || payload.type !== 'access') {
    return null;
  }

  return {
    userId: payload.userId as string,
    email: payload.email as string,
    role: payload.role as string,
  };
}

// Get user info including employee details (no longer fetches profiles)
export async function getUserInfo(userId: string) {
  const supabase = getSupabaseClient();
  
  // Get user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (userError || !user) return null;
  
  // Get role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  // Get employee (which now has profile data merged)
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return {
    user,
    role: roleData?.role || 'employee',
    employee,
  };
}

// Check if user has permission for a specific module and action
export async function checkPermission(userId: string, module: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Get user's role_id from user_roles
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role_id, role')
    .eq('user_id', userId)
    .maybeSingle();
  
  // Admin always has full access
  if (userRole?.role === 'admin') {
    return true;
  }
  
  if (!userRole?.role_id) {
    return false;
  }
  
  // Get role permissions
  const { data: role } = await supabase
    .from('roles')
    .select('permissions')
    .eq('id', userRole.role_id)
    .single();
  
  if (!role?.permissions) {
    return false;
  }
  
  // Find module permission
  const permissions = role.permissions as Array<{ module: string; create: boolean; read: boolean; update: boolean; delete: boolean }>;
  const modulePerm = permissions.find(p => p.module === module);
  
  if (!modulePerm) {
    return false;
  }
  
  return modulePerm[action] === true;
}

// Require permission - throws error if not authorized
export async function requirePermission(userId: string, module: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<void> {
  const hasPermission = await checkPermission(userId, module, action);
  if (!hasPermission) {
    throw new Error(`Permission denied: ${action} on ${module}`);
  }
}
