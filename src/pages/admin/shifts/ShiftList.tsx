import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Clock,
  Users,
  Moon,
  LayoutGrid,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Shift } from "@/types/settings";
import { defaultShifts } from "@/data/settingsData";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { ShiftForm } from "@/components/shifts/ShiftForm";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ShiftList() {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteShift, setDeleteShift] = useState<Shift | null>(null);

  const filteredShifts = shifts.filter(
    (shift) =>
      shift.name.toLowerCase().includes(search.toLowerCase()) ||
      shift.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveShift = (shiftData: Partial<Shift>) => {
    if (editingShift) {
      setShifts(prev =>
        prev.map(s =>
          s.id === editingShift.id
            ? { ...s, ...shiftData, updatedAt: new Date().toISOString().split('T')[0] }
            : s
        )
      );
      toast({ title: "Shift updated successfully" });
    } else {
      const newShift: Shift = {
        ...shiftData,
        id: `shift-${Date.now()}`,
        employeeCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      } as Shift;
      setShifts(prev => [...prev, newShift]);
      toast({ title: "Shift created successfully" });
    }
    setEditingShift(null);
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormOpen(true);
  };

  const handleDelete = (shift: Shift) => {
    setDeleteShift(shift);
  };

  const confirmDelete = () => {
    if (deleteShift) {
      setShifts(prev => prev.filter(s => s.id !== deleteShift.id));
      toast({ title: "Shift deleted successfully" });
      setDeleteShift(null);
    }
  };

  const handleToggleActive = (shift: Shift) => {
    setShifts(prev =>
      prev.map(s =>
        s.id === shift.id ? { ...s, isActive: !s.isActive } : s
      )
    );
    toast({
      title: `Shift ${shift.isActive ? "deactivated" : "activated"}`,
    });
  };

  const handleSetDefault = (shift: Shift) => {
    setShifts(prev =>
      prev.map(s => ({
        ...s,
        isDefault: s.id === shift.id,
      }))
    );
    toast({ title: `${shift.name} set as default shift` });
  };

  const stats = {
    total: shifts.length,
    active: shifts.filter(s => s.isActive).length,
    nightShifts: shifts.filter(s => s.isNightShift).length,
    totalEmployees: shifts.reduce((acc, s) => acc + s.employeeCount, 0),
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Shift Management" 
        description="Create and manage work shifts for your organization"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
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
              <Button onClick={() => { setEditingShift(null); setFormOpen(true); }}>
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
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onSetDefault={handleSetDefault}
                />
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
                  <TableHead>Grace</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShiftBadge 
                          name={shift.name} 
                          color={shift.color}
                          isNightShift={shift.isNightShift}
                          isFlexible={shift.isFlexible}
                        />
                        {shift.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{shift.code}</TableCell>
                    <TableCell>
                      {shift.isFlexible ? "Flexible" : `${shift.startTime} - ${shift.endTime}`}
                    </TableCell>
                    <TableCell>{shift.breakDuration} min</TableCell>
                    <TableCell>{shift.gracePeriod} min</TableCell>
                    <TableCell>{shift.employeeCount}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={shift.isActive} 
                        onCheckedChange={() => handleToggleActive(shift)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(shift)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(shift)}
                          disabled={shift.isDefault || shift.employeeCount > 0}
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
      <ShiftForm
        open={formOpen}
        onOpenChange={setFormOpen}
        shift={editingShift}
        onSave={handleSaveShift}
        existingCodes={shifts.map(s => s.code)}
      />

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