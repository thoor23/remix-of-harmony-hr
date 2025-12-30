import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Save, Loader2 } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { useUserRoleAssignment, useUpdateUserRoleAssignment } from "@/hooks/useUserRoleAssignment";
import { useHasPermission } from "@/components/auth/PermissionGate";

interface RoleAssignmentProps {
  userId: string;
  employeeName?: string;
}

export function RoleAssignment({ userId, employeeName }: RoleAssignmentProps) {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: currentAssignment, isLoading: assignmentLoading } = useUserRoleAssignment(userId);
  const updateMutation = useUpdateUserRoleAssignment();
  
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const canUpdate = useHasPermission("Roles", "update");

  // Sync selected role with current assignment
  useEffect(() => {
    if (currentAssignment?.role_id) {
      setSelectedRoleId(currentAssignment.role_id);
    }
  }, [currentAssignment]);

  const hasChanges = selectedRoleId !== (currentAssignment?.role_id || null);

  const handleSave = () => {
    updateMutation.mutate({ userId, roleId: selectedRoleId });
  };

  if (rolesLoading || assignmentLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const currentRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">System Role</Label>
      </div>
      
      <div className="flex items-center gap-3">
        <Select
          value={selectedRoleId || "no-role"}
          onValueChange={(value) => setSelectedRoleId(value === "no-role" ? null : value)}
          disabled={!canUpdate}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-role">
              <span className="text-muted-foreground">No role assigned</span>
            </SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex items-center gap-2">
                  <span>{role.name}</span>
                  {role.is_system && (
                    <span className="text-xs text-muted-foreground">(system)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canUpdate && hasChanges && (
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {currentRole?.description && (
        <p className="text-xs text-muted-foreground">{currentRole.description}</p>
      )}
    </div>
  );
}
