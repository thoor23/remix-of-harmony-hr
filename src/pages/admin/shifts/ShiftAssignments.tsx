import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Users,
  Calendar,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShiftAssignment, Shift } from "@/types/settings";
import { defaultShiftAssignments, defaultShifts } from "@/data/settingsData";
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

// Mock employees data
const mockEmployees = [
  { id: "emp-1", name: "John Doe", code: "EMP001", department: "Engineering" },
  { id: "emp-2", name: "Jane Smith", code: "EMP002", department: "Marketing" },
  { id: "emp-3", name: "Mike Johnson", code: "EMP003", department: "Sales" },
  { id: "emp-4", name: "Sarah Wilson", code: "EMP004", department: "Operations" },
  { id: "emp-5", name: "David Brown", code: "EMP005", department: "Engineering" },
  { id: "emp-6", name: "Emily Davis", code: "EMP006", department: "HR" },
  { id: "emp-7", name: "Chris Lee", code: "EMP007", department: "Finance" },
  { id: "emp-8", name: "Anna Taylor", code: "EMP008", department: "Marketing" },
];

interface AssignmentFormData {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export default function ShiftAssignments() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(defaultShiftAssignments);
  const [shifts] = useState<Shift[]>(defaultShifts);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null);
  const [deleteAssignment, setDeleteAssignment] = useState<ShiftAssignment | null>(null);
  const [form, setForm] = useState<AssignmentFormData>({
    employeeId: "",
    shiftId: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
  });

  const departments = [...new Set(mockEmployees.map(e => e.department))];
  
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = 
      a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      a.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = !departmentFilter || a.department === departmentFilter;
    const matchesShift = !shiftFilter || a.shiftId === shiftFilter;
    return matchesSearch && matchesDepartment && matchesShift;
  });

  const unassignedEmployees = mockEmployees.filter(
    e => !assignments.some(a => a.employeeId === e.id && a.isActive)
  );

  const handleOpenForm = (assignment?: ShiftAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setForm({
        employeeId: assignment.employeeId,
        shiftId: assignment.shiftId,
        effectiveFrom: assignment.effectiveFrom,
        effectiveTo: assignment.effectiveTo || "",
      });
    } else {
      setEditingAssignment(null);
      setForm({
        employeeId: "",
        shiftId: "",
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
      });
    }
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.employeeId || !form.shiftId || !form.effectiveFrom) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const employee = mockEmployees.find(e => e.id === form.employeeId);
    const shift = shifts.find(s => s.id === form.shiftId);
    
    if (!employee || !shift) return;

    if (editingAssignment) {
      setAssignments(prev =>
        prev.map(a =>
          a.id === editingAssignment.id
            ? {
                ...a,
                shiftId: form.shiftId,
                shiftName: shift.name,
                shiftColor: shift.color,
                effectiveFrom: form.effectiveFrom,
                effectiveTo: form.effectiveTo || undefined,
              }
            : a
        )
      );
      toast({ title: "Assignment updated successfully" });
    } else {
      const newAssignment: ShiftAssignment = {
        id: `assign-${Date.now()}`,
        employeeId: form.employeeId,
        employeeName: employee.name,
        employeeCode: employee.code,
        department: employee.department,
        shiftId: form.shiftId,
        shiftName: shift.name,
        shiftColor: shift.color,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || undefined,
        isActive: true,
      };
      setAssignments(prev => [...prev, newAssignment]);
      toast({ title: "Employee assigned to shift successfully" });
    }
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (deleteAssignment) {
      setAssignments(prev => prev.filter(a => a.id !== deleteAssignment.id));
      toast({ title: "Assignment removed successfully" });
      setDeleteAssignment(null);
    }
  };

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
                <p className="text-2xl font-bold">{assignments.filter(a => a.isActive).length}</p>
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
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{assignment.employeeCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.department}</TableCell>
                  <TableCell>
                    <ShiftBadge 
                      name={assignment.shiftName} 
                      color={assignment.shiftColor}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>{assignment.effectiveFrom}</TableCell>
                  <TableCell>{assignment.effectiveTo || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={assignment.isActive ? "default" : "secondary"}>
                      {assignment.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenForm(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteAssignment(assignment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                    ? mockEmployees 
                    : unassignedEmployees
                  ).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.code})
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
                  {shifts.filter(s => s.isActive).map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: shift.color }}
                        />
                        {shift.name} ({shift.startTime} - {shift.endTime})
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
                  value={form.effectiveFrom}
                  onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={form.effectiveTo}
                  onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAssignment ? "Update" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteAssignment}
        onOpenChange={(open) => !open && setDeleteAssignment(null)}
        onConfirm={confirmDelete}
        title="Remove Assignment"
        description={`Are you sure you want to remove ${deleteAssignment?.employeeName} from ${deleteAssignment?.shiftName} shift?`}
      />
    </PageContainer>
  );
}