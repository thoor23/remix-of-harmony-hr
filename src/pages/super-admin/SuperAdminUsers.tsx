import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Shield, Plus, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  is_active: boolean;
  company_id: string | null;
  created_at: string;
}

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "user", header: "User", accessor: "user.email", visible: true },
  { id: "created_at", header: "Added", accessor: "created_at", visible: true },
  { id: "actions", header: "Actions", accessor: "", visible: true },
];

export default function SuperAdminUsers() {
  const { superAdmins, superAdminsLoading, addSuperAdmin, removeSuperAdmin } = useSuperAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users for selection
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["super-admin", "users", search],
    queryFn: async () => {
      const response = await api.get<{ data: User[] }>(`/super-admin/users?search=${search}`);
      return response.data;
    },
    enabled: dialogOpen,
  });

  // Filter out users who are already super admins
  const availableUsers = users?.filter(
    (user) => !superAdmins.some((sa) => sa.user_id === user.id)
  );

  // Filter super admins based on search
  const filteredAdmins = useMemo(() => {
    return superAdmins.filter((admin) => {
      const searchLower = tableSearch.toLowerCase();
      const email = admin.user?.email?.toLowerCase() || "";
      return email.includes(searchLower);
    });
  }, [superAdmins, tableSearch]);

  // Sort super admins
  const sortedAdmins = useMemo(() => {
    if (!sortColumn) return filteredAdmins;
    return [...filteredAdmins].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";
      
      switch (sortColumn) {
        case "user":
          aValue = a.user?.email || "";
          bValue = b.user?.email || "";
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });
  }, [filteredAdmins, sortColumn, sortDirection]);

  // Pagination
  const totalItems = sortedAdmins.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedAdmins = sortedAdmins.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const visibleColumns = columns.filter(col => col.visible);

  const handleToggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleExport = () => {
    if (superAdmins.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = superAdmins.map(admin => ({
      id: admin.id,
      email: admin.user?.email || "",
      created_at: format(new Date(admin.created_at), "yyyy-MM-dd"),
    }));
    exportToCSV(exportData, columns.filter(c => c.id !== "actions"), "super-admins");
    toast.success("Exported successfully");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSort = (columnId: string) => {
    if (columnId === "actions") return;
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedAdmins.map(a => a.id)));
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

  const getSortIcon = (columnId: string) => {
    if (columnId === "actions") return null;
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" /> 
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleAddSuperAdmin = () => {
    if (selectedUserId) {
      addSuperAdmin(selectedUserId);
      setDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Super Admins"
        description="Manage platform super administrators"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Super Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Super Admin</DialogTitle>
              <DialogDescription>
                Select a user to grant super admin privileges
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {usersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : availableUsers?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No users found
                  </p>
                ) : (
                  availableUsers?.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUserId === user.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {format(new Date(user.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSuperAdmin} disabled={!selectedUserId}>
                Add Super Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilter(prev => !prev)}
          showFilter={showFilter}
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search super admins..."
                value={tableSearch}
                onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {superAdminsLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : superAdmins.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No super admins</h3>
            <p className="text-muted-foreground">
              Add your first super admin to manage the platform
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={paginatedAdmins.length > 0 && paginatedAdmins.every(a => selectedRows.has(a.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {visibleColumns.map(col => (
                      <TableHead 
                        key={col.id}
                        className={col.id !== "actions" ? "cursor-pointer hover:bg-muted/50" : "w-12"}
                        onClick={() => handleSort(col.id)}
                      >
                        <div className="flex items-center">
                          {col.header}
                          {getSortIcon(col.id)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAdmins.map((admin) => (
                    <TableRow key={admin.id} data-state={selectedRows.has(admin.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(admin.id)}
                          onCheckedChange={(checked) => handleSelectRow(admin.id, !!checked)}
                        />
                      </TableCell>
                      {visibleColumns.map(col => (
                        <TableCell key={col.id}>
                          {col.id === "user" && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{admin.user?.email || "Unknown"}</p>
                                <Badge variant="secondary" className="text-xs">
                                  Super Admin
                                </Badge>
                              </div>
                            </div>
                          )}
                          {col.id === "created_at" && (
                            <span className="text-muted-foreground">
                              {format(new Date(admin.created_at), "MMM d, yyyy")}
                            </span>
                          )}
                          {col.id === "actions" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Super Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove super admin privileges from{" "}
                                    <strong>{admin.user?.email}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeSuperAdmin(admin.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalItems > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            )}
          </>
        )}
      </Card>
    </PageContainer>
  );
}
