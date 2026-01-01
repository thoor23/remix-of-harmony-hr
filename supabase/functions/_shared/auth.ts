import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = 60 * 60 * 24; // 24 hours in seconds
const JWT_REFRESH_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days in seconds

// Default company ID for existing data
export const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

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

// Auth context with company information
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  isSuperAdmin: boolean;
}

// Check if user is super admin
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  return !!data;
}

// Get user's company ID
export async function getUserCompanyId(userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  
  // First check profiles table (new Supabase Auth structure)
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();
  
  if (profile?.company_id) {
    return profile.company_id;
  }
  
  // Fallback to employees table
  const { data: employee } = await supabase
    .from('employees')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle();
  
  return employee?.company_id || DEFAULT_COMPANY_ID;
}

// Get user role from user_roles table
export async function getUserRole(userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return roleData?.role || 'employee';
}

// Extract and verify token from request using Supabase Auth
export async function authenticateRequest(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Use Supabase Auth to verify the JWT
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.log('Auth error:', error?.message);
    return null;
  }

  const userId = user.id;
  
  // Get company context, role, and super admin status
  const [companyId, isSuperAdmin, role] = await Promise.all([
    getUserCompanyId(userId),
    checkIsSuperAdmin(userId),
    getUserRole(userId)
  ]);

  return {
    userId,
    email: user.email || '',
    role,
    companyId,
    isSuperAdmin,
  };
}

// Get user info including employee details
export async function getUserInfo(userId: string) {
  const supabase = getSupabaseClient();
  
  // Get profile (replaces old users table)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile) return null;
  
  // Get role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  // Get employee
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Get super admin status
  const isSuperAdmin = await checkIsSuperAdmin(userId);
  
  // Get company info
  const companyId = profile.company_id || employee?.company_id || DEFAULT_COMPANY_ID;
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  
  return {
    user: profile,
    role: roleData?.role || 'employee',
    employee,
    company,
    isSuperAdmin,
  };
}

// Check if user has permission for a specific module and action
export async function checkPermission(userId: string, module: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  // Super admin always has full access
  const isSuperAdmin = await checkIsSuperAdmin(userId);
  if (isSuperAdmin) {
    return true;
  }
  
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

// Helper to get company ID from request params or auth context
export function getRequestCompanyId(url: URL, auth: AuthContext): string {
  // Super admins can specify company_id in query params
  if (auth.isSuperAdmin) {
    const requestedCompanyId = url.searchParams.get('company_id');
    if (requestedCompanyId) {
      return requestedCompanyId;
    }
  }
  return auth.companyId;
}

// Apply company filter to query
export function applyCompanyFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T, 
  companyId: string, 
  columnName: string = 'company_id'
): T {
  return query.eq(columnName, companyId);
}

// Create base query with company filter
export interface QueryOptions {
  url: URL;
  auth: AuthContext;
  supabase: ReturnType<typeof getSupabaseClient>;
  table: string;
  select?: string;
}

export function createCompanyQuery(options: QueryOptions) {
  const { url, auth, supabase, table, select = '*' } = options;
  const companyId = getRequestCompanyId(url, auth);
  
  return {
    query: supabase.from(table).select(select).eq('company_id', companyId),
    companyId,
  };
}

// Helper to prepare insert data with company_id
export function withCompanyId<T extends Record<string, unknown>>(
  data: T, 
  companyId: string
): T & { company_id: string } {
  return { ...data, company_id: companyId };
}
