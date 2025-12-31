import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { Shield, Mail, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { toast } from "sonner";

interface Admin {
  id: string;
  user_id: string;
  role: string;
  role_name: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface CompanyAdminsListProps {
  companyId: string;
}

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "admin", header: "Admin", accessor: "email", visible: true },
  { id: "role", header: "Role", accessor: "role_name", visible: true },
  { id: "created_at", header: "Added", accessor: "created_at", visible: true },
];

export function CompanyAdminsList({ companyId }: CompanyAdminsListProps) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: admins, isLoading, refetch } = useQuery({
    queryKey: ["super-admin", "company-admins", companyId],
    queryFn: async () => {
      const response = await api.get<{ data: Admin[] }>(
        `/super-admin/companies/${companyId}/admins`
      );
      return response.data || [];
    },
    enabled: !!companyId,
  });

  // Filter admins based on search
  const filteredAdmins = useMemo(() => {
    return (admins || []).filter((admin) => {
      const searchLower = search.toLowerCase();
      const email = admin.email?.toLowerCase() || "";
      const role = (admin.role_name || admin.role || "").toLowerCase();
      const name = `${admin.first_name || ""} ${admin.last_name || ""}`.toLowerCase();
      return email.includes(searchLower) || role.includes(searchLower) || name.includes(searchLower);
    });
  }, [admins, search]);

  // Sort admins
  const sortedAdmins = useMemo(() => {
    if (!sortColumn) return filteredAdmins;
    return [...filteredAdmins].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";
      
      switch (sortColumn) {
        case "admin":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "role":
          aValue = a.role_name || a.role || "";
          bValue = b.role_name || b.role || "";
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
    if (!admins || admins.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      name: `${admin.first_name || ""} ${admin.last_name || ""}`.trim(),
      role: admin.role_name || admin.role,
      created_at: format(new Date(admin.created_at), "yyyy-MM-dd"),
    }));
    exportToCSV(exportData, columns, "company-admins");
    toast.success("Exported successfully");
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Data refreshed");
  };

  const handleSort = (columnId: string) => {
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
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" /> 
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!admins || admins.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No admin users found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create an admin user to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
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
              placeholder="Search admins..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </div>
      )}

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
                  className="cursor-pointer hover:bg-muted/50"
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
                    {col.id === "admin" && (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {admin.first_name?.[0] || admin.email[0].toUpperCase()}
                            {admin.last_name?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {admin.first_name && admin.last_name
                              ? `${admin.first_name} ${admin.last_name}`
                              : admin.email}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    )}
                    {col.id === "role" && (
                      <Badge variant="outline" className="capitalize">
                        {admin.role_name || admin.role}
                      </Badge>
                    )}
                    {col.id === "created_at" && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(admin.created_at), "MMM d, yyyy")}
                      </span>
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
    </Card>
  );
}
