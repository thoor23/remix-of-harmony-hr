import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Monitor, User } from "lucide-react";
import { modules, adminModules, employeeModules } from "@/data/settingsData";
import { RolePermission } from "@/types/settings";
import { PermissionMatrix } from "@/components/settings/PermissionMatrix";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";
import { 
  useRoles, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole,
  Role 
} from "@/hooks/useRoles";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasPermission } from "@/components/auth/PermissionGate";

// Get modules for a specific role type
const getModulesForRoleType = (roleType: 'admin' | 'employee') => {
  if (roleType === 'admin') {
    return adminModules;
  }
  // Employee role: ONLY employee modules (no admin modules)
  return employeeModules;
};

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "name", header: "Role Name", accessor: "name", visible: true },
  { id: "description", header: "Description", accessor: "description", visible: true },
  { id: "role_type", header: "Type", accessor: (row: Role) => row.role_type === 'employee' ? "Employee" : "Admin", visible: true },
  { id: "user_count", header: "Users", accessor: "user_count", visible: true },
  { id: "is_system", header: "System Role", accessor: (row: Role) => row.is_system ? "Yes" : "No", visible: false },
];

export default function RolesPage() {
  const { data: rolesData, isLoading, refetch } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  
  const canCreate = useHasPermission("Settings", "create");
  const canUpdate = useHasPermission("Settings", "update");
  const canDelete = useHasPermission("Settings", "delete");

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    roleType: "admin" as 'admin' | 'employee',
    permissions: adminModules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
  });
  const [deleteRoleDialog, setDeleteRoleDialog] = useState<Role | null>(null);

  const [roleSearch, setRoleSearch] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const roles = rolesData || [];

  const filteredRoles = useMemo(() => 
    roles.filter(r => 
      r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(roleSearch.toLowerCase())
    ), [roles, roleSearch]);

  const getColumnValue = (role: Role, column: ColumnDef): any => {
    if (typeof column.accessor === 'function') {
      return column.accessor(role);
    }
    return (role as any)[column.accessor];
  };

  const sortedRoles = useMemo(() => {
    if (!sortColumn) return filteredRoles;
    
    return [...filteredRoles].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    });
  }, [filteredRoles, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedRoles, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const openRoleDialog = (role?: Role) => {
    // Prevent editing system roles
    if (role?.is_system) {
      toast.error("System roles cannot be edited");
      return;
    }
    
    if (role) {
      setEditingRole(role);
      const roleType = role.role_type || 'admin';
      const availableModules = getModulesForRoleType(roleType);
      setRoleForm({ 
        name: role.name, 
        description: role.description || "", 
        roleType: roleType,
        permissions: role.permissions?.length > 0 
          ? [...role.permissions] 
          : availableModules.map(m => ({ module: m, create: false, read: true, update: false, delete: false }))
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: "",
        description: "",
        roleType: "admin",
        permissions: adminModules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
      });
    }
    setRoleDialogOpen(true);
  };

  const handleRoleTypeChange = (newRoleType: 'admin' | 'employee') => {
    const availableModules = getModulesForRoleType(newRoleType);
    setRoleForm(prev => ({
      ...prev,
      roleType: newRoleType,
      permissions: availableModules.map(m => ({ module: m, create: false, read: true, update: false, delete: false })),
    }));
  };

  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          id: editingRole.id,
          name: roleForm.name,
          description: roleForm.description || null,
          permissions: roleForm.permissions,
          role_type: roleForm.roleType,
        });
      } else {
        await createRole.mutateAsync({
          name: roleForm.name,
          description: roleForm.description || undefined,
          permissions: roleForm.permissions,
          role_type: roleForm.roleType,
        });
      }
      setRoleDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteRole = async () => {
    if (deleteRoleDialog) {
      try {
        await deleteRoleMutation.mutateAsync(deleteRoleDialog.id);
        setDeleteRoleDialog(null);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    );
  };

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0
      ? filteredRoles.filter(role => selectedRows.has(role.id))
      : filteredRoles;
    
    exportToCSV(dataToExport, columns, "roles");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(role => role.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(role => selectedRows.has(role.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (role: Role, column: ColumnDef) => {
    const value = getColumnValue(role, column);

    if (column.id === 'name') {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          {role.is_system && (
            <Badge variant="outline" className="text-xs">System</Badge>
          )}
        </div>
      );
    }

    if (column.id === 'description') {
      return <span className="text-muted-foreground">{value || "—"}</span>;
    }

    if (column.id === 'user_count') {
      return (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {value || 0}
        </div>
      );
    }

    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value}</span>;
    }

    return value || "—";
  };

  const isSaving = createRole.isPending || updateRole.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles and access control"
      />

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={canCreate ? () => openRoleDialog() : undefined}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isRefreshing}
          addRowLabel="Add Role"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.id} 
                      className="whitespace-nowrap cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort(column.id)}
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {sortColumn === column.id ? (
                          sortDirection === 'asc' 
                            ? <ArrowUp className="h-4 w-4" /> 
                            : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="text-center text-muted-foreground py-8">
                      No roles found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(role.id)}
                          onCheckedChange={(checked) => handleSelectRow(role.id, !!checked)}
                          aria-label={`Select ${role.name}`}
                        />
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.id} className="whitespace-nowrap">
                          {renderCellValue(role, column)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canUpdate && !role.is_system && (
                              <DropdownMenuItem onClick={() => openRoleDialog(role)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && !role.is_system && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteRoleDialog(role)}
                                disabled={(role.user_count || 0) > 0}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                            {role.is_system && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                System Role (Protected)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
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
                  disabled={editingRole?.is_system}
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
              <Label>Role Type <span className="text-destructive">*</span></Label>
              <Select
                value={roleForm.roleType}
                onValueChange={(value: 'admin' | 'employee') => handleRoleTypeChange(value)}
                disabled={editingRole?.is_system}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>Admin Role</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Employee Role</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleForm.roleType === 'admin' 
                  ? "Admin roles are redirected to Admin Dashboard after login. Shows admin panel modules only."
                  : "Employee roles are redirected to Employee Dashboard after login. Shows employee modules + admin modules (except Admin Dashboard)."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionMatrix
                permissions={roleForm.permissions}
                onChange={(permissions) => setRoleForm(prev => ({ ...prev, permissions }))}
                disabled={editingRole?.is_system && editingRole.name === "Admin"}
                roleType={roleForm.roleType}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole} disabled={isSaving}>
              {isSaving ? "Saving..." : editingRole ? "Update" : "Create"}
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
        warningText={deleteRoleDialog?.user_count ? `${deleteRoleDialog.user_count} users are assigned to this role.` : undefined}
        onConfirm={handleDeleteRole}
        isLoading={deleteRoleMutation.isPending}
      />
    </PageContainer>
  );
}
