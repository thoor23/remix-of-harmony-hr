/**
 * Supabase Helper Functions
 * Direct database query helpers for common operations
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get the current user's employee record
 */
export async function getCurrentEmployee(userId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments(*),
      designation:designations(*),
      store:stores!employees_primary_store_id_fkey(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current employee:', error);
    throw error;
  }

  return data;
}

/**
 * Get employee ID from user ID
 */
export async function getEmployeeId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    console.error('Error fetching employee ID:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get company ID from user's employee record or profile
 */
export async function getCompanyId(userId: string): Promise<string | null> {
  // Try from employees table first
  const { data: empData, error: empError } = await supabase
    .from('employees')
    .select('company_id')
    .eq('user_id', userId)
    .single();

  if (empData?.company_id) {
    return empData.company_id;
  }

  // Fallback: try from profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (profileData?.company_id) {
    return profileData.company_id;
  }

  return null;
}

/**
 * Get user's role from user_roles table
 */
export async function getUserRole(userId: string): Promise<{ role: string; roleId: string | null } | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, role_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching user role:', error);
    return null;
  }

  return data ? { role: data.role, roleId: data.role_id } : null;
}

/**
 * Check if user has admin or HR role
 */
export async function isAdminOrHR(userId: string): Promise<boolean> {
  const roleData = await getUserRole(userId);
  if (!roleData) return false;
  return roleData.role === 'admin' || roleData.role === 'hr';
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const roleData = await getUserRole(userId);
  return roleData?.role === 'admin';
}

/**
 * Get company ID with caching (for use in hooks)
 */
let cachedCompanyId: string | null = null;
let cachedUserId: string | null = null;

export async function getCachedCompanyId(userId: string): Promise<string | null> {
  if (cachedUserId === userId && cachedCompanyId) {
    return cachedCompanyId;
  }
  
  cachedCompanyId = await getCompanyId(userId);
  cachedUserId = userId;
  return cachedCompanyId;
}

/**
 * Clear the company ID cache (call on logout)
 */
export function clearCompanyIdCache() {
  cachedCompanyId = null;
  cachedUserId = null;
}

/**
 * Get current user's company ID (convenience function for hooks)
 * This fetches the session and returns the company ID
 */
export async function getCurrentCompanyId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('No authenticated user');
  }
  
  const companyId = await getCompanyId(session.user.id);
  if (!companyId) {
    throw new Error('No company found for user');
  }
  
  return companyId;
}

/**
 * Helper to add company_id filter to queries
 */
export function withCompanyFilter<T extends { company_id?: string }>(
  data: T,
  companyId: string
): T & { company_id: string } {
  return { ...data, company_id: companyId };
}
