import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Clock,
  Users,
  Moon,
  LayoutGrid,
  List,
  Loader2
} from "lucide-react";
import { ShiftCard } from "@/components/shifts/ShiftCard";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift, ShiftData } from "@/hooks/useShifts";
import { toast } from "sonner";

export default function ShiftList() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
  const [deleteShift, setDeleteShift] = useState<ShiftData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    start_time: "09:00",
    end_time: "18:00",
    break_duration: 60,
    color: "#3B82F6",
  });

  const { data: shifts = [], isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();

  const filteredShifts = shifts.filter(
    (shift) =>
      shift.name.toLowerCase().includes(search.toLowerCase()) ||
      shift.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (shift?: ShiftData) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        code: shift.code,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_duration: shift.break_duration || 60,
        color: shift.color || "#3B82F6",
      });
    } else {
      setEditingShift(null);
      setFormData({
        name: "",
        code: "",
        start_time: "09:00",
        end_time: "18:00",
        break_duration: 60,
        color: "#3B82F6",
      });
    }
    setFormOpen(true);
  };

  const handleSaveShift = () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and code are required");
      return;
    }

    if (editingShift) {
      updateShift.mutate({
        id: editingShift.id,
        data: formData,
      }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createShift.mutate(formData, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleToggleActive = (shift: ShiftData) => {
    updateShift.mutate({
      id: shift.id,
      data: { is_active: !shift.is_active },
    });
  };

  const confirmDelete = () => {
    if (deleteShift) {
      deleteShiftMutation.mutate(deleteShift.id, {
        onSuccess: () => setDeleteShift(null),
      });
    }
  };

  const stats = {
    total: shifts.length,
    active: shifts.filter(s => s.is_active).length,
    nightShifts: shifts.filter(s => {
      const startHour = parseInt(s.start_time?.split(":")[0] || "0");
      return startHour >= 18 || startHour < 6;
    }).length,
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Shift Management" 
        description="Create and manage work shifts for your organization"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Moon className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.nightShifts}</p>
                <p className="text-sm text-muted-foreground">Night Shifts</p>
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
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Shifts</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shifts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
                <TabsList className="h-9">
                  <TabsTrigger value="grid" className="px-2">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-2">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredShifts.map((shift) => (
                <Card key={shift.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: shift.color || "#3B82F6" }} 
                      />
                      <span className="font-medium">{shift.name}</span>
                      {!shift.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Code: {shift.code}
                    </p>
                    <p className="text-sm">
                      {shift.start_time} - {shift.end_time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Break: {shift.break_duration || 0} min
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleOpenForm(shift)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteShift(shift)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: shift.color || "#3B82F6" }} 
                        />
                        <span className="font-medium">{shift.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{shift.code}</TableCell>
                    <TableCell>{shift.start_time} - {shift.end_time}</TableCell>
                    <TableCell>{shift.break_duration || 0} min</TableCell>
                    <TableCell>
                      <Switch 
                        checked={shift.is_active || false} 
                        onCheckedChange={() => handleToggleActive(shift)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenForm(shift)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteShift(shift)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredShifts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No shifts found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Add New Shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Shift Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Morning Shift"
                />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="MORN"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Break Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.break_duration}
                  onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveShift}
              disabled={createShift.isPending || updateShift.isPending}
            >
              {(createShift.isPending || updateShift.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingShift ? "Update" : "Create"} Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteShift}
        onOpenChange={(open) => !open && setDeleteShift(null)}
        onConfirm={confirmDelete}
        title="Delete Shift"
        description={`Are you sure you want to delete "${deleteShift?.name}"? This action cannot be undone.`}
      />
    </PageContainer>
  );
}
