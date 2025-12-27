import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { defaultRoles, modules } from "@/data/settingsData";
import { Role } from "@/types/settings";
import { PermissionMatrix } from "@/components/settings/PermissionMatrix";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { toast } from "sonner";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: modules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
  });
  const [deleteRoleDialog, setDeleteRoleDialog] = useState<Role | null>(null);

  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, description: role.description, permissions: [...role.permissions] });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: "",
        description: "",
        permissions: modules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
      });
    }
    setRoleDialogOpen(true);
  };

  const saveRole = () => {
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (editingRole) {
      setRoles(prev => prev.map(r => 
        r.id === editingRole.id 
          ? { ...r, name: roleForm.name, description: roleForm.description, permissions: roleForm.permissions }
          : r
      ));
      toast.success("Role updated successfully");
    } else {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        userCount: 0,
        permissions: roleForm.permissions,
      };
      setRoles(prev => [...prev, newRole]);
      toast.success("Role added successfully");
    }
    setRoleDialogOpen(false);
  };

  const deleteRole = () => {
    if (deleteRoleDialog) {
      setRoles(prev => prev.filter(r => r.id !== deleteRoleDialog.id));
      toast.success("Role deleted successfully");
      setDeleteRoleDialog(null);
    }
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[
        { label: "Settings", href: "/admin/settings/departments" },
        { label: "Roles & Permissions" }
      ]} />

      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles and access control"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles</CardTitle>
          <Button onClick={() => openRoleDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {role.userCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openRoleDialog(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteRoleDialog(role)}
                            disabled={role.userCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Update role and permissions" : "Create a new role with custom permissions"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., Team Lead"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={editingRole?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of the role"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionMatrix
                permissions={roleForm.permissions}
                onChange={(permissions) => setRoleForm(prev => ({ ...prev, permissions }))}
                disabled={editingRole?.isSystem && editingRole.name === "Admin"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteRoleDialog}
        onOpenChange={(open) => !open && setDeleteRoleDialog(null)}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        itemName={deleteRoleDialog?.name}
        warningText={deleteRoleDialog?.userCount ? `${deleteRoleDialog.userCount} users are assigned to this role.` : undefined}
        onConfirm={deleteRole}
      />
    </PageContainer>
  );
}