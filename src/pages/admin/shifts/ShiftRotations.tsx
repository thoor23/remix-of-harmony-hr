import { useState } from "react";
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
  Calendar,
  Play,
  Pause
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShiftRotation, Shift } from "@/types/settings";
import { defaultShiftRotations, defaultShifts } from "@/data/settingsData";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// Mock employees
const mockEmployees = [
  { id: "emp-1", name: "John Doe" },
  { id: "emp-2", name: "Jane Smith" },
  { id: "emp-3", name: "Mike Johnson" },
  { id: "emp-4", name: "Sarah Wilson" },
  { id: "emp-5", name: "David Brown" },
  { id: "emp-6", name: "Emily Davis" },
];

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
  const { toast } = useToast();
  const [rotations, setRotations] = useState<ShiftRotation[]>(defaultShiftRotations);
  const [shifts] = useState<Shift[]>(defaultShifts);
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

  const filteredRotations = rotations.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (rotation?: ShiftRotation) => {
    if (rotation) {
      setEditingRotation(rotation);
      setForm({
        name: rotation.name,
        description: rotation.description,
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

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Please enter a rotation name", variant: "destructive" });
      return;
    }
    if (form.rotationPattern.length < 2) {
      toast({ title: "Select at least 2 shifts for rotation", variant: "destructive" });
      return;
    }

    if (editingRotation) {
      setRotations(prev =>
        prev.map(r =>
          r.id === editingRotation.id
            ? {
                ...r,
                ...form,
                employeeCount: form.employeeIds.length,
              }
            : r
        )
      );
      toast({ title: "Rotation updated successfully" });
    } else {
      const newRotation: ShiftRotation = {
        id: `rotation-${Date.now()}`,
        ...form,
        employeeCount: form.employeeIds.length,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setRotations(prev => [...prev, newRotation]);
      toast({ title: "Rotation created successfully" });
    }
    setFormOpen(false);
  };

  const handleToggleActive = (rotation: ShiftRotation) => {
    setRotations(prev =>
      prev.map(r =>
        r.id === rotation.id ? { ...r, isActive: !r.isActive } : r
      )
    );
    toast({
      title: `Rotation ${rotation.isActive ? "paused" : "activated"}`,
    });
  };

  const confirmDelete = () => {
    if (deleteRotation) {
      setRotations(prev => prev.filter(r => r.id !== deleteRotation.id));
      toast({ title: "Rotation deleted successfully" });
      setDeleteRotation(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shift Rotations</h1>
        <p className="text-muted-foreground">
          Create rotation patterns to automatically alternate employee shifts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rotation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenForm(rotation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteRotation(rotation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRotations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No rotations found
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
              {form.rotationPattern.length > 0 && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-muted-foreground">Pattern:</span>
                  {form.rotationPattern.map((id, idx) => {
                    const shift = getShiftById(id);
                    return shift ? (
                      <span key={idx} className="flex items-center gap-1">
                        <Badge variant="outline" style={{ borderColor: shift.color, color: shift.color }}>
                          {shift.name}
                        </Badge>
                        {idx < form.rotationPattern.length - 1 && "→"}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign Employees</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[120px] overflow-y-auto border rounded-lg p-2">
                {mockEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2"
                  >
                    <Checkbox 
                      id={emp.id}
                      checked={form.employeeIds.includes(emp.id)}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                    />
                    <label htmlFor={emp.id} className="text-sm cursor-pointer">
                      {emp.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingRotation ? "Update" : "Create"} Rotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteRotation}
        onOpenChange={(open) => !open && setDeleteRotation(null)}
        onConfirm={confirmDelete}
        title="Delete Rotation"
        description={`Are you sure you want to delete "${deleteRotation?.name}"? This will stop all automatic shift rotations for assigned employees.`}
      />
    </div>
  );
}