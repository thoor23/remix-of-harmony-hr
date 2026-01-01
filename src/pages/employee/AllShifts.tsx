import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { usePagination } from "@/hooks/usePagination";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import {
  ArrowLeftRight,
  Search,
  Users,
  User,
  AlertCircle,
} from "lucide-react";
import { useCreateShiftExchangeRequest } from "@/hooks/useShiftExchange";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyShiftAssignment, useShiftAssignments, useShifts } from "@/hooks/useShifts";
import { useEmployeeList, useDepartments } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function EmployeeAllShifts() {
  const navigate = useNavigate();
  const { data: currentEmployee, isLoading: isLoadingEmployee } = useCurrentEmployee();
  const { data: myShiftAssignments = [] } = useMyShiftAssignment(currentEmployee?.id);
  const { data: shiftAssignments = [], isFetching } = useShiftAssignments();
  const { data: shifts = [] } = useShifts();
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployeeList();
  const { data: departments = [] } = useDepartments();
  const queryClient = useQueryClient();

  const myShiftAssignment = Array.isArray(myShiftAssignments) ? myShiftAssignments[0] : myShiftAssignments;

  const createExchange = useCreateShiftExchangeRequest();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [preSelectedTarget, setPreSelectedTarget] = useState<{
    employeeId: string;
    employeeName: string;
    shiftId: string;
    shiftName: string;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "employee", header: "Employee", visible: true },
    { id: "employee_id", header: "Employee ID", visible: true },
    { id: "department", header: "Department", visible: true },
    { id: "shift", header: "Shift", visible: true },
    { id: "timing", header: "Timing", visible: true },
  ]);

  const [formData, setFormData] = useState({
    targetEmployeeId: "",
    requestDate: "",
    reason: "",
  });

  const currentShift = myShiftAssignment ? {
    id: myShiftAssignment.shift_id,
    name: (myShiftAssignment as any).shift?.name || '',
    color: (myShiftAssignment as any).shift?.color || '#3B82F6',
    start_time: (myShiftAssignment as any).shift?.start_time || '',
    end_time: (myShiftAssignment as any).shift?.end_time || '',
  } : null;

  const getEmployeeAssignment = (employeeId: string) => {
    return shiftAssignments.find((a: any) => a.employee_id === employeeId && a.is_active);
  };

  const getShift = (shiftId: string) => {
    return shifts.find((s) => s.id === shiftId);
  };

  // All employees with their shift assignments (excluding current user)
  const allEmployeesWithShifts = useMemo(() => {
    return employees
      .filter((emp) => emp.id !== currentEmployee?.id && emp.status === "active")
      .map((emp) => {
        const assignment = getEmployeeAssignment(emp.id);
        const shift = assignment ? getShift(assignment.shift_id) : null;
        const name = emp.first_name || emp.last_name
          ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
          : emp.employee_id;
        return {
          id: emp.id,
          name,
          employeeCode: emp.employee_id,
          departmentId: emp.department?.id || null,
          departmentName: emp.department?.name || "-",
          avatarUrl: emp.avatar_url,
          firstName: emp.first_name,
          lastName: emp.last_name,
          shiftId: shift?.id || null,
          shiftName: shift?.name || null,
          shiftColor: shift?.color || "#3B82F6",
          startTime: shift?.start_time || null,
          endTime: shift?.end_time || null,
        };
      })
      .filter((e) => e.shiftId); // Only show employees with assigned shifts
  }, [employees, currentEmployee, shiftAssignments, shifts]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let data = [...allEmployeesWithShifts];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      data = data.filter(
        (e) =>
          e.name.toLowerCase().includes(searchLower) ||
          e.employeeCode.toLowerCase().includes(searchLower)
      );
    }

    if (shiftFilter !== "all") {
      data = data.filter((e) => e.shiftId === shiftFilter);
    }

    if (deptFilter !== "all") {
      data = data.filter((e) => e.departmentId === deptFilter);
    }

    return data;
  }, [allEmployeesWithShifts, searchQuery, shiftFilter, deptFilter]);

  const pagination = usePagination({ data: filteredEmployees, defaultPageSize: 10 });

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  };

  const handleExport = () => {
    const exportData = filteredEmployees.map((e) => ({
      employee: e.name,
      employee_id: e.employeeCode,
      department: e.departmentName,
      shift: e.shiftName,
      timing: `${e.startTime || ""} - ${e.endTime || ""}`,
    }));

    exportToCSV(exportData, columns, `all-shifts-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success(`Exported ${exportData.length} shift assignments`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shift-assignments"] });
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  // Open exchange request dialog with pre-selected target
  const handleExchangeRequest = (target: {
    id: string;
    name: string;
    shiftId: string | null;
    shiftName: string | null;
  }) => {
    if (!target.shiftId || !target.shiftName) return;
    
    setPreSelectedTarget({
      employeeId: target.id,
      employeeName: target.name,
      shiftId: target.shiftId,
      shiftName: target.shiftName,
    });
    setFormData({
      targetEmployeeId: target.id,
      requestDate: "",
      reason: "",
    });
    setIsCreateOpen(true);
  };

  const handleCreateRequest = () => {
    if (!currentEmployee?.id || !myShiftAssignment) return;
    const targetAssignment = getEmployeeAssignment(formData.targetEmployeeId);
    if (!targetAssignment) return;

    createExchange.mutate(
      {
        requester_id: currentEmployee.id,
        target_employee_id: formData.targetEmployeeId,
        requester_shift_id: myShiftAssignment.shift_id,
        target_shift_id: targetAssignment.shift_id,
        request_date: formData.requestDate,
        reason: formData.reason,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({ targetEmployeeId: "", requestDate: "", reason: "" });
          setPreSelectedTarget(null);
          navigate("/app/my-shift-exchange");
        },
      }
    );
  };

  if (isLoadingEmployee || isLoadingEmployees) {
    return (
      <PageContainer>
        <PageHeader title="All Shift Assignments" description="View all employees with their assigned shifts" />
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="All Shift Assignments" 
        description="View all employees with their assigned shifts and request exchange" 
      />

      {/* Stats Card */}
      <div className="mb-6">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{allEmployeesWithShifts.length}</p>
            <p className="text-sm text-muted-foreground">Employees with Shifts</p>
          </div>
        </Card>
      </div>

      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={isFetching}
        />

        {showFilters && (
          <div className="px-4 py-3 border-b flex items-center gap-4 flex-wrap">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || shiftFilter !== "all" || deptFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setShiftFilter("all");
                  setDeptFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              {columns.find((c) => c.id === "employee")?.visible && (
                <TableHead>Employee</TableHead>
              )}
              {columns.find((c) => c.id === "employee_id")?.visible && (
                <TableHead>Employee ID</TableHead>
              )}
              {columns.find((c) => c.id === "department")?.visible && (
                <TableHead>Department</TableHead>
              )}
              {columns.find((c) => c.id === "shift")?.visible && (
                <TableHead>Shift</TableHead>
              )}
              {columns.find((c) => c.id === "timing")?.visible && (
                <TableHead>Timing</TableHead>
              )}
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.map((emp) => (
              <TableRow key={emp.id}>
                {columns.find((c) => c.id === "employee")?.visible && (
                  <TableCell>
                    <EmployeeCell
                      avatarUrl={emp.avatarUrl}
                      firstName={emp.firstName}
                      lastName={emp.lastName}
                      employeeId={emp.employeeCode}
                    />
                  </TableCell>
                )}
                {columns.find((c) => c.id === "employee_id")?.visible && (
                  <TableCell className="font-mono text-muted-foreground">
                    {emp.employeeCode}
                  </TableCell>
                )}
                {columns.find((c) => c.id === "department")?.visible && (
                  <TableCell>{emp.departmentName}</TableCell>
                )}
                {columns.find((c) => c.id === "shift")?.visible && (
                  <TableCell>
                    {emp.shiftName && (
                      <ShiftBadge name={emp.shiftName} color={emp.shiftColor} />
                    )}
                  </TableCell>
                )}
                {columns.find((c) => c.id === "timing")?.visible && (
                  <TableCell className="text-muted-foreground">
                    {emp.startTime && emp.endTime ? `${emp.startTime} - ${emp.endTime}` : "-"}
                  </TableCell>
                )}
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleExchangeRequest(emp)}
                    disabled={!currentShift}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Exchange
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pagination.paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No employees with shift assignments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={filteredEmployees.length}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </Card>

      {/* Create Exchange Request Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setPreSelectedTarget(null);
          setFormData({ targetEmployeeId: "", requestDate: "", reason: "" });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift Exchange</DialogTitle>
            <DialogDescription>Submit a request to swap your shift with a colleague</DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Your Current Shift</p>
            <div className="flex items-center gap-2">
              {currentShift ? (
                <>
                  <ShiftBadge name={currentShift.name} color={currentShift.color || "#3B82F6"} />
                  <span className="text-sm">{currentShift.start_time} - {currentShift.end_time}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No shift assigned</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Swap With</label>
              {preSelectedTarget && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{preSelectedTarget.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{preSelectedTarget.shiftName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreSelectedTarget(null);
                      setFormData({ ...formData, targetEmployeeId: "" });
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Exchange Date</label>
              <DatePicker
                value={formData.requestDate}
                onChange={(value) => setFormData({ ...formData, requestDate: value })}
                placeholder="Select exchange date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Exchange</label>
              <Textarea
                placeholder="Explain why you need to swap shifts..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm dark:bg-amber-900/20 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Your request will be reviewed by a manager. You'll be notified once it's approved or rejected.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateRequest} 
              disabled={!formData.targetEmployeeId || !formData.requestDate || !formData.reason || createExchange.isPending}
            >
              {createExchange.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
