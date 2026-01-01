import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, Phone, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { toast } from "sonner";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  employment_type: string;
  avatar_url: string | null;
  department?: { name: string } | null;
  designation?: { name: string } | null;
}

interface CompanyEmployeesListProps {
  companyId: string;
}

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee", header: "Employee", accessor: "first_name", visible: true },
  { id: "contact", header: "Contact", accessor: "email", visible: true },
  { id: "department", header: "Department", accessor: "department.name", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
];

export function CompanyEmployeesList({ companyId }: CompanyEmployeesListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ["super-admin", "company-employees", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, employee_id, first_name, last_name, email, phone,
          status, employment_type, avatar_url,
          department:departments(name),
          designation:designations(name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Employee[];
    },
    enabled: !!companyId,
  });

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((employee) => {
      const searchLower = search.toLowerCase();
      const name = `${employee.first_name || ""} ${employee.last_name || ""}`.toLowerCase();
      const email = employee.email?.toLowerCase() || "";
      const phone = employee.phone?.toLowerCase() || "";
      const department = employee.department?.name?.toLowerCase() || "";
      const designation = employee.designation?.name?.toLowerCase() || "";
      const empId = employee.employee_id?.toLowerCase() || "";
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             phone.includes(searchLower) ||
             department.includes(searchLower) ||
             designation.includes(searchLower) ||
             empId.includes(searchLower);
    });
  }, [employees, search]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    if (!sortColumn) return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";
      
      switch (sortColumn) {
        case "employee":
          aValue = `${a.first_name || ""} ${a.last_name || ""}`;
          bValue = `${b.first_name || ""} ${b.last_name || ""}`;
          break;
        case "contact":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "department":
          aValue = a.department?.name || "";
          bValue = b.department?.name || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  }, [filteredEmployees, sortColumn, sortDirection]);

  // Pagination
  const totalItems = sortedEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedEmployees = sortedEmployees.slice(
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
    if (!employees || employees.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = employees.map(emp => ({
      id: emp.id,
      employee_id: emp.employee_id,
      name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department?.name || "",
      designation: emp.designation?.name || "",
      status: emp.status,
      employment_type: emp.employment_type,
    }));
    exportToCSV(exportData, columns, "company-employees");
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
      setSelectedRows(new Set(paginatedEmployees.map(e => e.id)));
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
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No employees found</p>
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
              placeholder="Search employees..."
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
                  checked={paginatedEmployees.length > 0 && paginatedEmployees.every(e => selectedRows.has(e.id))}
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
            {paginatedEmployees.map((employee) => (
              <TableRow key={employee.id} data-state={selectedRows.has(employee.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(employee.id)}
                    onCheckedChange={(checked) => handleSelectRow(employee.id, !!checked)}
                  />
                </TableCell>
                {visibleColumns.map(col => (
                  <TableCell key={col.id}>
                    {col.id === "employee" && (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback>
                            {employee.first_name?.[0]}
                            {employee.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employee_id}
                          </p>
                        </div>
                      </div>
                    )}
                    {col.id === "contact" && (
                      <div className="space-y-1">
                        {employee.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{employee.email}</span>
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{employee.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {col.id === "department" && (
                      <div>
                        <p className="text-sm">{employee.department?.name || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.designation?.name || "-"}
                        </p>
                      </div>
                    )}
                    {col.id === "status" && (
                      <Badge
                        variant={employee.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {employee.status}
                      </Badge>
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
