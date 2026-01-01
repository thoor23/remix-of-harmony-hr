// Centralized navigation helpers for consistent routing

type RoleType = 'admin' | 'employee' | null;
type AppRole = 'admin' | 'hr' | 'manager' | 'employee' | null;

interface GetLandingPathParams {
  isSuperAdmin?: boolean;
  role?: AppRole;
  roleType?: RoleType;
}

/**
 * Get the landing path based on user's role/permissions
 * Priority: isSuperAdmin > roleType > role
 */
export function getLandingPath({ isSuperAdmin, role, roleType }: GetLandingPathParams): string {
  // Super admin goes to super admin dashboard
  if (isSuperAdmin) {
    return '/super-admin';
  }
  
  // Check roleType first (from PermissionContext)
  if (roleType === 'admin') {
    return '/app/dashboard';
  }
  
  if (roleType === 'employee') {
    return '/app/my-dashboard';
  }
  
  // Fallback to role from AuthContext
  if (role === 'admin' || role === 'hr' || role === 'manager') {
    return '/app/dashboard';
  }
  
  // Default to employee dashboard
  return '/app/my-dashboard';
}

/**
 * Check if a role should be treated as admin-type
 */
export function isAdminRole(role: AppRole): boolean {
  return role === 'admin' || role === 'hr' || role === 'manager';
}
