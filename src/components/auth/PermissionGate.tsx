import { ReactNode } from "react";
import { usePermissions } from "@/contexts/PermissionContext";

interface PermissionGateProps {
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PermissionGate component - Controls visibility of elements based on user permissions
 * 
 * Usage:
 * <PermissionGate module="Employees" action="create">
 *   <Button>Add Employee</Button>
 * </PermissionGate>
 */
export function PermissionGate({ 
  module, 
  action, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { canCreate, canRead, canUpdate, canDelete, loading } = usePermissions();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Check permission based on action
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
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook version of PermissionGate for more complex logic
 */
export function useHasPermission(module: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
  const { canCreate, canRead, canUpdate, canDelete, loading } = usePermissions();

  if (loading) return false;

  switch (action) {
    case 'create':
      return canCreate(module);
    case 'read':
      return canRead(module);
    case 'update':
      return canUpdate(module);
    case 'delete':
      return canDelete(module);
    default:
      return false;
  }
}
