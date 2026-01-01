import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RolePermission } from "@/types/settings";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/navigation";

interface PermissionContextType {
  permissions: RolePermission[];
  roleId: string | null;
  roleName: string | null;
  roleType: 'admin' | 'employee' | null;
  loading: boolean;
  hasModuleAccess: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canRead: (module: string) => boolean;
  canUpdate: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, role: authRole } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [roleType, setRoleType] = useState<'admin' | 'employee' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setRoleId(null);
      setRoleName(null);
      setRoleType(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user role from user_roles table
      const { data: userRole, error: userRoleError } = await supabase
        .from('user_roles')
        .select('role, role_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (userRoleError) {
        console.error("Error fetching user_roles:", userRoleError);
      }
      
      // Determine roleType from user_roles.role OR fallback to authRole
      let currentRoleType: 'admin' | 'employee' = 'employee';
      
      if (userRole?.role) {
        currentRoleType = isAdminRole(userRole.role as any) ? 'admin' : 'employee';
      } else if (authRole) {
        currentRoleType = isAdminRole(authRole) ? 'admin' : 'employee';
      }
      
      setRoleType(currentRoleType);
      
      if (!userRole?.role_id) {
        // No role_id assigned - try to find default role for this role type
        const defaultRoleName = currentRoleType === 'admin' ? 'Admin' : 'Employee';
        
        const { data: defaultRole } = await supabase
          .from('roles')
          .select('id, name, permissions')
          .eq('name', defaultRoleName)
          .maybeSingle();
        
        if (defaultRole) {
          setRoleId(defaultRole.id);
          setRoleName(defaultRole.name);
          const perms = Array.isArray(defaultRole.permissions) 
            ? defaultRole.permissions as unknown as RolePermission[]
            : [];
          setPermissions(perms);
          setLoading(false);
          return;
        }
        
        // Fallback: no permissions
        setRoleId(null);
        setRoleName(userRole?.role || authRole || 'employee');
        setPermissions([]);
        setLoading(false);
        return;
      }
      
      // Get role details and permissions
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('id', userRole.role_id)
        .single();
      
      if (roleError) {
        console.error("Error fetching role:", roleError);
      }
      
      if (role) {
        setRoleId(role.id);
        setRoleName(role.name);
        
        // Parse permissions
        const perms = Array.isArray(role.permissions) 
          ? role.permissions as unknown as RolePermission[]
          : [];
        setPermissions(perms);
      } else {
        setPermissions([]);
        setRoleId(null);
        setRoleName(null);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions([]);
      setRoleId(null);
      setRoleName(null);
      // Keep roleType based on authRole fallback
      if (authRole) {
        setRoleType(isAdminRole(authRole) ? 'admin' : 'employee');
      } else {
        setRoleType(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, authRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getModulePermission = useCallback((module: string): RolePermission | undefined => {
    return permissions.find(p => p.module === module);
  }, [permissions]);

  const hasModuleAccess = useCallback((module: string): boolean => {
    const perm = getModulePermission(module);
    if (!perm) return false;
    return perm.create || perm.read || perm.update || perm.delete;
  }, [getModulePermission]);

  const canCreate = useCallback((module: string): boolean => {
    const perm = getModulePermission(module);
    return perm?.create ?? false;
  }, [getModulePermission]);

  const canRead = useCallback((module: string): boolean => {
    const perm = getModulePermission(module);
    return perm?.read ?? false;
  }, [getModulePermission]);

  const canUpdate = useCallback((module: string): boolean => {
    const perm = getModulePermission(module);
    return perm?.update ?? false;
  }, [getModulePermission]);

  const canDelete = useCallback((module: string): boolean => {
    const perm = getModulePermission(module);
    return perm?.delete ?? false;
  }, [getModulePermission]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        roleId,
        roleName,
        roleType,
        loading,
        hasModuleAccess,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
