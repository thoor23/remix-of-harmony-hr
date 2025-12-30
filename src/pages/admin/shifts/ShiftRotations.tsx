import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { useHasPermission } from "@/components/auth/PermissionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  RefreshCw,
  Edit,
  Trash2,
  Users,
  Play,
  Pause
} from "lucide-react";
import { ShiftBadge } from "@/components/shifts/ShiftBadge";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { useShifts } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { 
  useShiftRotations, 
  useCreateShiftRotation, 
  useUpdateShiftRotation, 
  useDeleteShiftRotation,
  ShiftRotation
} from "@/hooks/useShiftRotations";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface RotationFormData {
  name: string;
  description: string;
  rotationPattern: string[];
  rotationFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  employeeIds: string[];
  isActive: boolean;
}

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

export default function ShiftRotations() {
  const { data: shiftsData, isLoading: shiftsLoading } = useShifts();
  const { data: employeesData, isLoading: employeesLoading } = useEmployees();
  const { data: rotationsData, isLoading: rotationsLoading, refetch } = useShiftRotations();
  const createRotation = useCreateShiftRotation();
  const updateRotation = useUpdateShiftRotation();
  const deleteRotationMutation = useDeleteShiftRotation();
  
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRotation, setEditingRotation] = useState<ShiftRotation | null>(null);
  const [deleteRotation, setDeleteRotation] = useState<ShiftRotation | null>(null);
  const [form, setForm] = useState<RotationFormData>({
    name: "",
    description: "",
    rotationPattern: [],
    rotationFrequency: "weekly",
    employeeIds: [],
    isActive: true,
  });

  const canCreate = useHasPermission("Shifts", "create");
  const canUpdate = useHasPermission("Shifts", "update");
  const canDelete = useHasPermission("Shifts", "delete");

  // Transform rotations from API to local format
  const rotations = useMemo(() => {
    if (!rotationsData) return [];
    return rotationsData.map(r => ({
      ...r,
      rotationPattern: r.rotation_pattern || [],
      rotationFrequency: r.rotation_frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
      employeeIds: r.employee_ids || [],
      employeeCount: (r.employee_ids || []).length,
      isActive: r.is_active ?? true,
      createdAt: r.created_at,
    }));
  }, [rotationsData]);

  // Transform shifts from API to match local format
  const shifts = useMemo(() => {
    if (!shiftsData) return [];
    return shiftsData.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      startTime: s.start_time,
      endTime: s.end_time,
      color: s.color || 'hsl(221, 83%, 53%)',
      isActive: s.is_active ?? true,
    }));
  }, [shiftsData]);

  // Get employees list
  const employees = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map(emp => ({
      id: emp.id,
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_id,
    }));
  }, [employeesData]);

  const filteredRotations = rotations.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (rotation?: typeof rotations[0]) => {
    if (rotation) {
      setEditingRotation(rotation as ShiftRotation);
      setForm({
        name: rotation.name,
        description: rotation.description || "",
        rotationPattern: rotation.rotationPattern,
        rotationFrequency: rotation.rotationFrequency,
        employeeIds: rotation.employeeIds,
        isActive: rotation.isActive,
      });
    } else {
      setEditingRotation(null);
      setForm({
        name: "",
        description: "",
        rotationPattern: [],
        rotationFrequency: "weekly",
        employeeIds: [],
        isActive: true,
      });
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a rotation name");
      return;
    }
    if (form.rotationPattern.length < 2) {
      toast.error("Select at least 2 shifts for rotation");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      rotation_pattern: form.rotationPattern,
      rotation_frequency: form.rotationFrequency,
      employee_ids: form.employeeIds,
      is_active: form.isActive,
    };

    try {
      if (editingRotation) {
        await updateRotation.mutateAsync({ id: editingRotation.id, ...payload });
      } else {
        await createRotation.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleToggleActive = async (rotation: typeof rotations[0]) => {
    try {
      await updateRotation.mutateAsync({
        id: rotation.id,
        is_active: !rotation.isActive,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const confirmDelete = async () => {
    if (deleteRotation) {
      try {
        await deleteRotationMutation.mutateAsync(deleteRotation.id);
        setDeleteRotation(null);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const toggleShiftInPattern = (shiftId: string) => {
    setForm(prev => ({
      ...prev,
      rotationPattern: prev.rotationPattern.includes(shiftId)
        ? prev.rotationPattern.filter(id => id !== shiftId)
        : [...prev.rotationPattern, shiftId],
    }));
  };

  const toggleEmployee = (employeeId: string) => {
    setForm(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter(id => id !== employeeId)
        : [...prev.employeeIds, employeeId],
    }));
  };

  const getShiftById = (id: string) => shifts.find(s => s.id === id);

  const isLoading = shiftsLoading || employeesLoading || rotationsLoading;
  const isSaving = createRotation.isPending || updateRotation.isPending;

  return (
    <PageContainer>
      <PageHeader 
        title="Shift Rotations" 
        description="Create rotation patterns to automatically alternate employee shifts"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rotations.length}</p>
                <p className="text-sm text-muted-foreground">Total Rotations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Play className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rotations.filter(r => r.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Rotations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rotations.reduce((acc, r) => acc + r.employeeCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Employees in Rotations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Rotation Patterns</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rotations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button onClick={() => refetch()} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {canCreate && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rotation
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rotation Name</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRotations.map((rotation) => (
                  <TableRow key={rotation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rotation.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {rotation.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rotation.rotationPattern.map((shiftId, idx) => {
                          const shift = getShiftById(shiftId);
                          return shift ? (
                            <div key={idx} className="flex items-center gap-1">
                              <ShiftBadge 
                                name={shift.name} 
                                color={shift.color}
                                size="sm"
                              />
                              {idx < rotation.rotationPattern.length - 1 && (
                                <span className="text-muted-foreground">→</span>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {frequencyLabels[rotation.rotationFrequency]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {rotation.employeeCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={rotation.isActive} 
                        onCheckedChange={() => handleToggleActive(rotation)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenForm(rotation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeleteRotation(rotation as ShiftRotation)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredRotations.length === 0 && (
            <div className="py-12 px-4 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No rotations found</h3>
                  <p className="text-muted-foreground text-sm">
                    {search ? "Try adjusting your search" : "Get started by creating your first rotation"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRotation ? "Edit Rotation" : "Create Rotation Pattern"}
            </DialogTitle>
            <DialogDescription>
              Define a rotation pattern that will automatically alternate shifts
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Rotation Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Weekly Rotation A"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe this rotation pattern..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Rotation Frequency</Label>
              <Select 
                value={form.rotationFrequency} 
                onValueChange={(v: 'daily' | 'weekly' | 'biweekly' | 'monthly') => 
                  setForm({ ...form, rotationFrequency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shift Pattern (select in order) *</Label>
              <p className="text-xs text-muted-foreground">
                Select at least 2 shifts. They will rotate in the order selected.
              </p>
              {shifts.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No shifts available. Create shifts first.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {shifts.filter(s => s.isActive).map((shift) => (
                    <div
                      key={shift.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.rotationPattern.includes(shift.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleShiftInPattern(shift.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={form.rotationPattern.includes(shift.id)}
                          onCheckedChange={() => toggleShiftInPattern(shift.id)}
                        />
                        <ShiftBadge 
                          name={shift.name} 
                          color={shift.color}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {form.rotationPattern.length > 0 && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Selected Pattern:</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {form.rotationPattern.map((shiftId, idx) => {
                      const shift = getShiftById(shiftId);
                      return shift ? (
                        <div key={idx} className="flex items-center gap-1">
                          <ShiftBadge name={shift.name} color={shift.color} size="sm" />
                          {idx < form.rotationPattern.length - 1 && (
                            <span className="text-muted-foreground">→</span>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign Employees (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Select employees to include in this rotation
              </p>
              {employees.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No employees available.
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <Checkbox 
                        checked={form.employeeIds.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <span>{emp.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {form.employeeIds.length} employee(s) selected
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable this rotation immediately
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : editingRotation ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteRotation}
        onOpenChange={(open) => !open && setDeleteRotation(null)}
        title="Delete Rotation"
        description="Are you sure you want to delete this rotation pattern? This action cannot be undone."
        itemName={deleteRotation?.name}
        onConfirm={confirmDelete}
        isLoading={deleteRotationMutation.isPending}
      />
    </PageContainer>
  );
}
