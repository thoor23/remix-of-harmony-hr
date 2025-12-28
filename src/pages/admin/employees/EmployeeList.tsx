import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useEmployees, useDepartments, useDeleteEmployee, EmployeeWithDetails } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { toast } from "sonner";

// Define all employee columns
const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "user_id", header: "User ID", accessor: "user_id", visible: false },
  { id: "first_name", header: "First Name", accessor: "first_name", visible: true },
  { id: "last_name", header: "Last Name", accessor: "last_name", visible: true },
  { id: "email", header: "Email", accessor: "email", visible: true },
  { id: "phone", header: "Phone", accessor: "phone", visible: false },
  { id: "avatar_url", header: "Avatar URL", accessor: "avatar_url", visible: false },
  { id: "employee_id", header: "Employee ID", accessor: "employee_id", visible: true },
  { id: "department_id", header: "Department ID", accessor: "department_id", visible: false },
  { id: "department", header: "Department", accessor: "department.name", visible: true },
  { id: "designation_id", header: "Designation ID", accessor: "designation_id", visible: false },
  { id: "designation", header: "Designation", accessor: "designation.name", visible: true },
  { id: "status", header: "Status", accessor: "status", visible: true },
  { id: "employment_type", header: "Employment Type", accessor: "employment_type", visible: false },
  { id: "date_of_joining", header: "Date of Joining", accessor: "date_of_joining", visible: true },
  { id: "date_of_birth", header: "Date of Birth", accessor: "date_of_birth", visible: false },
  { id: "address_street", header: "Address Street", accessor: "address_street", visible: false },
  { id: "address_city", header: "Address City", accessor: "address_city", visible: false },
  { id: "address_state", header: "Address State", accessor: "address_state", visible: false },
  { id: "address_country", header: "Address Country", accessor: "address_country", visible: false },
  { id: "address_zip_code", header: "Address Zip Code", accessor: "address_zip_code", visible: false },
  { id: "emergency_contact_name", header: "Emergency Contact Name", accessor: "emergency_contact_name", visible: false },
  { id: "emergency_contact_relationship", header: "Emergency Contact Relationship", accessor: "emergency_contact_relationship", visible: false },
  { id: "emergency_contact_phone", header: "Emergency Contact Phone", accessor: "emergency_contact_phone", visible: false },
  { id: "bank_name", header: "Bank Name", accessor: "bank_name", visible: false },
  { id: "bank_account_number", header: "Bank Account Number", accessor: "bank_account_number", visible: false },
  { id: "bank_ifsc_code", header: "Bank IFSC Code", accessor: "bank_ifsc_code", visible: false },
  { id: "bank_account_holder_name", header: "Bank Account Holder Name", accessor: "bank_account_holder_name", visible: false },
  { id: "reporting_to", header: "Reporting To", accessor: "reporting_to", visible: false },
  { id: "created_at", header: "Created At", accessor: "created_at", visible: false },
  { id: "updated_at", header: "Updated At", accessor: "updated_at", visible: false },
];

export default function EmployeeList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeWithDetails | null>(null);
  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: employees = [], isLoading: loadingEmployees, refetch, isFetching } = useEmployees();
  const { data: departments = [], isLoading: loadingDepartments } = useDepartments();
  const deleteEmployee = useDeleteEmployee();

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const firstName = emp.first_name || "";
      const lastName = emp.last_name || "";
      const email = emp.email || "";
      const employeeId = emp.employee_id || "";

      const matchesSearch =
        firstName.toLowerCase().includes(search.toLowerCase()) ||
        lastName.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        employeeId.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        departmentFilter === "all" || emp.department?.id === departmentFilter;

      const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const sortedEmployees = useMemo(() => {
    if (!sortColumn) return filteredEmployees;
    
    return [...filteredEmployees].sort((a, b) => {
      const column = columns.find(c => c.id === sortColumn);
      if (!column) return 0;
      
      const aValue = getNestedValue(a, column.accessor as string);
      const bValue = getNestedValue(b, column.accessor as string);
      
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
  }, [filteredEmployees, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedEmployees, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const handleDeleteClick = (employee: EmployeeWithDetails) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      deleteEmployee.mutate(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const getFullName = (employee: EmployeeWithDetails) => {
    const first = employee.first_name || "";
    const last = employee.last_name || "";
    return `${first} ${last}`.trim() || "Unknown";
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
      ? filteredEmployees.filter(emp => selectedRows.has(emp.id))
      : filteredEmployees;
    
    exportToCSV(dataToExport, columns, "employees");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(emp => emp.id)));
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
    paginatedData.every(emp => selectedRows.has(emp.id));


  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (employee: EmployeeWithDetails, column: ColumnDef) => {
    const value = typeof column.accessor === 'function' 
      ? column.accessor(employee)
      : getNestedValue(employee, column.accessor);

    // Special rendering for status
    if (column.id === 'status') {
      return <StatusBadge status={value as "active" | "inactive" | "on-leave" | "terminated"} />;
    }

    // Format dates
    if (column.id === 'date_of_joining' || column.id === 'date_of_birth') {
      return value ? format(new Date(value), "MMM dd, yyyy") : "—";
    }

    if (column.id === 'created_at' || column.id === 'updated_at') {
      return value ? format(new Date(value), "MMM dd, yyyy HH:mm") : "—";
    }

    // Truncate UUIDs
    if (column.id === 'id' || column.id === 'user_id' || column.id === 'department_id' || 
        column.id === 'designation_id' || column.id === 'reporting_to') {
      return value ? (
        <span className="font-mono text-xs">{value.substring(0, 8)}...</span>
      ) : "—";
    }

    return value || "—";
  };

  if (loadingEmployees || loadingDepartments) {
    return (
      <PageContainer>
        <PageHeader title="Employees" description="Manage your organization's employees" />
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        </Card>
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        description="Manage your organization's employees"
      />

      <Card>
        {/* Toolbar */}
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => navigate('/admin/employees/new')}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Add Employee"
        />

        {/* Filters */}
        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
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
              {paginatedData.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(employee.id)}
                      onCheckedChange={(checked) => handleSelectRow(employee.id, !!checked)}
                      aria-label={`Select ${getFullName(employee)}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="whitespace-nowrap">
                      {renderCellValue(employee, column)}
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
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/employees/${employee.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/employees/${employee.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(employee)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No employees found matching your criteria.
          </div>
        )}

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employeeToDelete ? getFullName(employeeToDelete) : ""}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
