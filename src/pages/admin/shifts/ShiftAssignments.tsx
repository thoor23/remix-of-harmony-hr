import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Users,
  Calendar,
  Edit,
  Trash2,
  UserPlus,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useShifts, useShiftAssignments, useCreateShiftAssignment, useUpdateShiftAssignment, useDeleteShiftAssignment } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDashboard";
import { useStores } from "@/hooks/useStores";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface AssignmentFormData {
  employeeId: string;
  shiftId: string;
  storeId: string;
  startDate: string;
  endDate: string;
}

const getInitialColumns = (): ColumnDef[] => [
  { id: "id", header: "ID", accessor: "id", visible: false },
  { id: "employee_name", header: "Employee", accessor: (row: any) => {
    const profile = row.employee?.profile;
    if (!profile) return row.employee?.employee_id || "Unknown";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";
  }, visible: true },
  { id: "employee_id", header: "Emp ID", accessor: (row: any) => row.employee?.employee_id, visible: true },
  { id: "department", header: "Department", accessor: (row: any) => row.employee?.department?.name || "—", visible: true },
  { id: "store", header: "Store", accessor: (row: any) => row.store?.name || "—", visible: true },
  { id: "shift_name", header: "Current Shift", accessor: (row: any) => row.shift?.name || "—", visible: true },
  { id: "start_date", header: "Effective From", accessor: "start_date", visible: true },
  { id: "end_date", header: "Effective To", accessor: "end_date", visible: true },
  { id: "is_active", header: "Status", accessor: (row: any) => row.is_active ? "Active" : "Inactive", visible: true },
];

export default function ShiftAssignments() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentFormData>({
    employeeId: "",
    shiftId: "",
    storeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const [showFilter, setShowFilter] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>(getInitialColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: assignments = [], isLoading: assignmentsLoading, refetch, isFetching } = useShiftAssignments();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: stores = [] } = useStores();
  
  const createAssignment = useCreateShiftAssignment();
  const updateAssignment = useUpdateShiftAssignment();
  const deleteAssignment = useDeleteShiftAssignment();

  const isLoading = shiftsLoading || assignmentsLoading || employeesLoading;

  const getEmployeeName = (assignment: typeof assignments[0]) => {
    const profile = assignment.employee?.profile;
    if (!profile) return assignment.employee?.employee_id || "Unknown";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";
  };

  const filteredAssignments = useMemo(() => 
    assignments.filter((a) => {
      const name = getEmployeeName(a).toLowerCase();
      const empId = a.employee?.employee_id?.toLowerCase() || "";
      const matchesSearch = name.includes(search.toLowerCase()) || empId.includes(search.toLowerCase());
      const matchesDepartment = !departmentFilter || a.employee?.department?.id === departmentFilter;
      const matchesShift = !shiftFilter || a.shift_id === shiftFilter;
      const matchesStore = !storeFilter || a.store_id === storeFilter;
      return matchesSearch && matchesDepartment && matchesShift && matchesStore;
    }), [assignments, search, departmentFilter, shiftFilter, storeFilter]);

  const getColumnValue = (assignment: any, column: ColumnDef): any => {
    if (typeof column.accessor === 'function') {
      return column.accessor(assignment);
    }
    return assignment[column.accessor];
  };

  const sortedAssignments = useMemo(() => {
    if (!sortColumn) return filteredAssignments;
    
    return [...filteredAssignments].sort((a, b) => {
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
  }, [filteredAssignments, sortColumn, sortDirection, columns]);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedAssignments, defaultPageSize: 10 });

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false), 
    [columns]
  );

  const assignedEmployeeIds = assignments.filter(a => a.is_active).map(a => a.employee_id);
  const unassignedEmployees = employees.filter(e => !assignedEmployeeIds.includes(e.id));

  const handleOpenForm = (assignmentId?: string) => {
    if (assignmentId) {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        setEditingAssignment(assignmentId);
        setForm({
          employeeId: assignment.employee_id,
          shiftId: assignment.shift_id,
          storeId: assignment.store_id || "",
          startDate: assignment.start_date,
          endDate: assignment.end_date || "",
        });
      }
    } else {
      setEditingAssignment(null);
      setForm({
        employeeId: "",
        shiftId: "",
        storeId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
    }
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.employeeId || !form.shiftId || !form.startDate) return;

    if (editingAssignment) {
      updateAssignment.mutate(
        {
          id: editingAssignment,
          data: {
            shift_id: form.shiftId,
            store_id: form.storeId || undefined,
            start_date: form.startDate,
            end_date: form.endDate || undefined,
          },
        },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createAssignment.mutate(
        {
          employee_id: form.employeeId,
          shift_id: form.shiftId,
          store_id: form.storeId || undefined,
          start_date: form.startDate,
          end_date: form.endDate || undefined,
        },
        { onSuccess: () => setFormOpen(false) }
      );
    }
  };

  const confirmDelete = () => {
    if (deleteAssignmentId) {
      deleteAssignment.mutate(deleteAssignmentId, {
        onSuccess: () => setDeleteAssignmentId(null),
      });
    }
  };

  const getEmployeeNameById = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return empId;
    if (!emp.first_name && !emp.last_name) return emp.employee_id;
    return `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.employee_id;
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
      ? filteredAssignments.filter(a => selectedRows.has(a.id))
      : filteredAssignments;
    
    exportToCSV(dataToExport, columns, "shift_assignments");
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(a => a.id)));
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
    paginatedData.every(a => selectedRows.has(a.id));

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (assignment: any, column: ColumnDef) => {
    const value = getColumnValue(assignment, column);
    const shift = shifts.find(s => s.id === assignment.shift_id);

    if (column.id === 'shift_name' && shift) {
      return (
        <ShiftBadge 
          name={shift.name} 
          color={shift.color || "#888"}
          size="sm"
        />
      );
    }

    if (column.id === 'start_date' || column.id === 'end_date') {
      return value ? format(new Date(value), "MMM dd, yyyy") : "—";
    }

    if (column.id === 'is_active') {
      return (
        <Badge variant={assignment.is_active ? "default" : "secondary"}>
          {assignment.is_active ? "Active" : "Inactive"}
        </Badge>
      );
    }

    if (column.id === 'id') {
      return <span className="font-mono text-xs">{value?.substring(0, 8)}...</span>;
    }

    return value || "—";
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Shift Assignments" description="Assign employees to shifts" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Shift Assignments" 
        description="Assign employees to shifts and manage their schedules"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.filter(a => a.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unassignedEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={() => handleOpenForm()}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Assign"
        />

        {showFilter && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={departmentFilter || "_all"} onValueChange={(v) => setDepartmentFilter(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={storeFilter || "_all"} onValueChange={(v) => setStoreFilter(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={shiftFilter || "_all"} onValueChange={(v) => setShiftFilter(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Shifts</SelectItem>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center text-muted-foreground py-8">
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(assignment.id)}
                        onCheckedChange={(checked) => handleSelectRow(assignment.id, !!checked)}
                        aria-label={`Select assignment`}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} className="whitespace-nowrap">
                        {renderCellValue(assignment, column)}
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
                          <DropdownMenuItem onClick={() => handleOpenForm(assignment.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteAssignmentId(assignment.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      {/* Assignment Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Assignment" : "Assign Employee to Shift"}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment 
                ? "Update the shift assignment details" 
                : "Select an employee and assign them to a shift"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select 
                value={form.employeeId} 
                onValueChange={(v) => setForm({ ...form, employeeId: v })}
                disabled={!!editingAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {(editingAssignment 
                    ? employees 
                    : unassignedEmployees
                  ).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {getEmployeeNameById(emp.id)} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shift *</Label>
              <Select 
                value={form.shiftId} 
                onValueChange={(v) => setForm({ ...form, shiftId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.filter(s => s.is_active).map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: shift.color || "#888" }}
                        />
                        {shift.name} ({shift.start_time} - {shift.end_time})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Store</Label>
              <Select 
                value={form.storeId || "none"} 
                onValueChange={(v) => setForm({ ...form, storeId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific store</SelectItem>
                  {stores.filter(s => s.is_active).map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective From *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!form.employeeId || !form.shiftId || createAssignment.isPending || updateAssignment.isPending}
            >
              {editingAssignment ? "Update" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteAssignmentId}
        onOpenChange={(open) => !open && setDeleteAssignmentId(null)}
        onConfirm={confirmDelete}
        title="Remove Assignment"
        description="Are you sure you want to remove this shift assignment?"
      />
    </PageContainer>
  );
}
