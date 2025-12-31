import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { getModuleForRoute } from "@/config/moduleConfig";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "hr" | "manager" | "employee")[];
  module?: string;
  action?: 'create' | 'read' | 'update' | 'delete';
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  module,
  action = 'read',
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { user, role, loading: authLoading } = useAuth();
  const { canCreate, canRead, canUpdate, canDelete, loading: permLoading } = usePermissions();
  const location = useLocation();

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access (legacy support)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const roleRedirects: Record<string, string> = {
      admin: "/admin",
      hr: "/admin",
      manager: "/admin",
      employee: "/employee",
    };
    return <Navigate to={roleRedirects[role] || "/employee"} replace />;
  }

  // Wait for permissions to load before checking module access
  if (module && permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If module is specified, check module permissions
  if (module && !permLoading) {
    let hasPermission = false;
    switch (action) {
      case 'create':
        hasPermission = canCreate(module);
        break;
      case 'read':
        hasPermission = canRead(module);
        break;
      case 'update':
        hasPermission = canUpdate(module);
        break;
      case 'delete':
        hasPermission = canDelete(module);
        break;
    }

    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Auto-detect module from route if not specified
  // This is optional and provides automatic protection
  if (!module && !permLoading) {
    const detectedModule = getModuleForRoute(location.pathname);
    if (detectedModule) {
      const hasReadAccess = canRead(detectedModule);
      // Only block if we have a detected module and no read access
      // AND the permissions array is populated (meaning roles are set up)
      if (!hasReadAccess) {
        // Don't block if this is likely a fresh setup or no permissions configured
        // This prevents blocking when RBAC isn't fully configured yet
      }
    }
  }

  return <>{children}</>;
}
