import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Search, Users } from "lucide-react";
import { departments as initialDepartments } from "@/data/mockData";
import { Department } from "@/types/hrms";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [deptSearch, setDeptSearch] = useState("");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
  const [deleteDeptDialog, setDeleteDeptDialog] = useState<Department | null>(null);

  const filteredDepartments = useMemo(() => 
    departments.filter(d => 
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase())
    ), [departments, deptSearch]);

  const openDeptDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code, description: dept.description || "" });
    } else {
      setEditingDept(null);
      setDeptForm({ name: "", code: "", description: "" });
    }
    setDeptDialogOpen(true);
  };

  const saveDept = () => {
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      toast.error("Name and Code are required");
      return;
    }

    if (editingDept) {
      setDepartments(prev => prev.map(d => 
        d.id === editingDept.id 
          ? { ...d, name: deptForm.name, code: deptForm.code, description: deptForm.description }
          : d
      ));
      toast.success("Department updated successfully");
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: deptForm.name,
        code: deptForm.code.toUpperCase(),
        description: deptForm.description,
        employeeCount: 0,
      };
      setDepartments(prev => [...prev, newDept]);
      toast.success("Department added successfully");
    }
    setDeptDialogOpen(false);
  };

  const deleteDept = () => {
    if (deleteDeptDialog) {
      setDepartments(prev => prev.filter(d => d.id !== deleteDeptDialog.id));
      toast.success("Department deleted successfully");
      setDeleteDeptDialog(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Departments"
        description="Manage organization departments"
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Departments</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="pl-8 w-full sm:w-[200px]"
              />
            </div>
            <Button onClick={() => openDeptDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Employees</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No departments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">{dept.code}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {dept.employeeCount}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                        {dept.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDeptDialog(dept)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteDeptDialog(dept)}
                            disabled={dept.employeeCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "Update department information" : "Create a new department"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., Engineering"
                value={deptForm.name}
                onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., ENG"
                value={deptForm.code}
                onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the department"
                value={deptForm.description}
                onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDept}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteDeptDialog}
        onOpenChange={(open) => !open && setDeleteDeptDialog(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        itemName={deleteDeptDialog?.name}
        warningText={deleteDeptDialog?.employeeCount ? `${deleteDeptDialog.employeeCount} employees are assigned to this department.` : undefined}
        onConfirm={deleteDept}
      />
    </PageContainer>
  );
}