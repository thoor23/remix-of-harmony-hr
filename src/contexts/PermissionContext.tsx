import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import api from "@/lib/api";
import { RolePermission } from "@/types/settings";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionContextType {
  permissions: RolePermission[];
  roleId: string | null;
  roleName: string | null;
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
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setRoleId(null);
      setRoleName(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get<{ 
        roleId: string | null; 
        roleName: string | null; 
        permissions: RolePermission[] 
      }>("/settings/user-permissions");
      
      setRoleId(data.roleId);
      setRoleName(data.roleName);
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions([]);
      setRoleId(null);
      setRoleName(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
