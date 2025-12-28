import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { useEmployees, useDepartments, useDeleteEmployee, EmployeeWithDetails } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";

export default function EmployeeList() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeWithDetails | null>(null);

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: departments = [], isLoading: loadingDepartments } = useDepartments();
  const deleteEmployee = useDeleteEmployee();

  const filteredEmployees = employees.filter((emp) => {
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

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: filteredEmployees, defaultPageSize: 10 });

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

  const getInitials = (employee: EmployeeWithDetails) => {
    const first = employee.first_name?.[0] || "";
    const last = employee.last_name?.[0] || "";
    return (first + last).toUpperCase() || "??";
  };

  const getFullName = (employee: EmployeeWithDetails) => {
    const first = employee.first_name || "";
    const last = employee.last_name || "";
    return `${first} ${last}`.trim() || "Unknown";
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
      >
        <Button asChild>
          <Link to="/admin/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 mb-6">
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
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={employee.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(employee)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getFullName(employee)}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.email || "No email"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {employee.employee_id}
                </TableCell>
                <TableCell>{employee.department?.name || "—"}</TableCell>
                <TableCell>{employee.designation?.name || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status as "active" | "inactive" | "on-leave" | "terminated"} />
                </TableCell>
                <TableCell>
                  {format(new Date(employee.date_of_joining), "MMM dd, yyyy")}
                </TableCell>
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
        {filteredEmployees.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No employees found matching your criteria.
          </div>
        )}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
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
