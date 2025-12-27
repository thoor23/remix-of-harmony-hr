import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Users,
  Calendar,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { useShifts, useShiftAssignments, useCreateShiftAssignment, useUpdateShiftAssignment, useDeleteShiftAssignment } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDashboard";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AssignmentFormData {
  employeeId: string;
  shiftId: string;
  startDate: string;
  endDate: string;
}

export default function ShiftAssignments() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentFormData>({
    employeeId: "",
    shiftId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: assignments = [], isLoading: assignmentsLoading } = useShiftAssignments();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  
  const createAssignment = useCreateShiftAssignment();
  const updateAssignment = useUpdateShiftAssignment();
  const deleteAssignment = useDeleteShiftAssignment();

  const isLoading = shiftsLoading || assignmentsLoading || employeesLoading;

  const getEmployeeName = (assignment: typeof assignments[0]) => {
    const profile = assignment.employee?.profile;
    if (!profile) return assignment.employee?.employee_id || "Unknown";
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";
  };

  const filteredAssignments = assignments.filter((a) => {
    const name = getEmployeeName(a).toLowerCase();
    const empId = a.employee?.employee_id?.toLowerCase() || "";
    const matchesSearch = name.includes(search.toLowerCase()) || empId.includes(search.toLowerCase());
    const matchesDepartment = !departmentFilter || a.employee?.department?.id === departmentFilter;
    const matchesShift = !shiftFilter || a.shift_id === shiftFilter;
    return matchesSearch && matchesDepartment && matchesShift;
  });

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
          startDate: assignment.start_date,
          endDate: assignment.end_date || "",
        });
      }
    } else {
      setEditingAssignment(null);
      setForm({
        employeeId: "",
        shiftId: "",
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
    const profile = emp.profile;
    if (!profile) return emp.employee_id;
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || emp.employee_id;
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
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Employee Shift Assignments</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[180px]"
                />
              </div>
              <Select value={departmentFilter || "_all"} onValueChange={(v) => setDepartmentFilter(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={shiftFilter || "_all"} onValueChange={(v) => setShiftFilter(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Shifts</SelectItem>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>{shift.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Shift</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => {
                const shift = shifts.find(s => s.id === assignment.shift_id);
                return (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getEmployeeName(assignment)}</p>
                        <p className="text-sm text-muted-foreground">{assignment.employee?.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.employee?.department?.name || "—"}</TableCell>
                    <TableCell>
                      {shift && (
                        <ShiftBadge 
                          name={shift.name} 
                          color={shift.color || "#888"}
                          size="sm"
                        />
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(assignment.start_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{assignment.end_date ? format(new Date(assignment.end_date), "MMM dd, yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={assignment.is_active ? "default" : "secondary"}>
                        {assignment.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenForm(assignment.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteAssignmentId(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No assignments found
            </div>
          )}
        </CardContent>
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
