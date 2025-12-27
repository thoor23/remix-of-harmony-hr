import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";
import { useDepartmentsData } from "@/hooks/useDepartments";
import {
  useDesignationsData,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/hooks/useDesignations";

interface DesignationForm {
  name: string;
  code: string;
  level: number;
  department_id: string;
}

export default function DesignationsPage() {
  const { data: departments = [] } = useDepartmentsData();
  const { data: designations = [], isLoading } = useDesignationsData();
  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const deleteDesignation = useDeleteDesignation();

  const [desSearch, setDesSearch] = useState("");
  const [desDialogOpen, setDesDialogOpen] = useState(false);
  const [editingDes, setEditingDes] = useState<typeof designations[0] | null>(null);
  const [desForm, setDesForm] = useState<DesignationForm>({ name: "", code: "", level: 1, department_id: "" });
  const [deleteDesDialog, setDeleteDesDialog] = useState<typeof designations[0] | null>(null);

  const filteredDesignations = useMemo(() => 
    designations.filter(d => 
      d.name.toLowerCase().includes(desSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(desSearch.toLowerCase())
    ), [designations, desSearch]);

  const openDesDialog = (des?: typeof designations[0]) => {
    if (des) {
      setEditingDes(des);
      setDesForm({ 
        name: des.name, 
        code: des.code, 
        level: des.level || 1, 
        department_id: des.department_id || "" 
      });
    } else {
      setEditingDes(null);
      setDesForm({ name: "", code: "", level: 1, department_id: "" });
    }
    setDesDialogOpen(true);
  };

  const saveDes = async () => {
    if (!desForm.name.trim() || !desForm.code.trim()) {
      return;
    }

    if (editingDes) {
      await updateDesignation.mutateAsync({
        id: editingDes.id,
        name: desForm.name,
        code: desForm.code.toUpperCase(),
        level: desForm.level,
        department_id: desForm.department_id || undefined,
      });
    } else {
      await createDesignation.mutateAsync({
        name: desForm.name,
        code: desForm.code.toUpperCase(),
        level: desForm.level,
        department_id: desForm.department_id || undefined,
      });
    }
    setDesDialogOpen(false);
  };

  const handleDeleteDes = async () => {
    if (deleteDesDialog) {
      await deleteDesignation.mutateAsync({ id: deleteDesDialog.id, name: deleteDesDialog.name });
      setDeleteDesDialog(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Designations" description="Manage job titles and position levels" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Designations"
        description="Manage job titles and position levels"
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Designations</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={desSearch}
                onChange={(e) => setDesSearch(e.target.value)}
                className="pl-8 w-full sm:w-[200px]"
              />
            </div>
            <Button onClick={() => openDesDialog()}>
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
                  <TableHead>Level</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesignations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No designations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDesignations.map((des) => (
                    <TableRow key={des.id}>
                      <TableCell className="font-medium">{des.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">{des.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {des.level || 1}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {des.department?.name || "All Departments"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDesDialog(des)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDesDialog(des)}>
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

      <Dialog open={desDialogOpen} onOpenChange={setDesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDes ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription>
              {editingDes ? "Update designation information" : "Create a new designation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., Software Engineer"
                value={desForm.name}
                onChange={(e) => setDesForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., SWE"
                value={desForm.code}
                onChange={(e) => setDesForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={desForm.level}
                onChange={(e) => setDesForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground">Higher level = more senior position</p>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={desForm.department_id || "_all"}
                onValueChange={(value) => setDesForm(prev => ({ ...prev, department_id: value === "_all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveDes}
              disabled={createDesignation.isPending || updateDesignation.isPending}
            >
              {editingDes ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteDesDialog}
        onOpenChange={(open) => !open && setDeleteDesDialog(null)}
        title="Delete Designation"
        description="Are you sure you want to delete this designation? This action cannot be undone."
        itemName={deleteDesDialog?.name}
        onConfirm={handleDeleteDes}
      />
    </PageContainer>
  );
}
