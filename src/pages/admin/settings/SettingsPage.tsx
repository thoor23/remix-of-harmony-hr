import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Edit, Trash2, Building2, Briefcase, Shield } from "lucide-react";
import { departments, designations } from "@/data/mockData";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isDesDialogOpen, setIsDesDialogOpen] = useState(false);

  const handleSaveDept = () => {
    toast.success("Department saved successfully");
    setIsDeptDialogOpen(false);
  };

  const handleSaveDes = () => {
    toast.success("Designation saved successfully");
    setIsDesDialogOpen(false);
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Settings" }]} />

      <PageHeader
        title="Settings"
        description="Manage departments, designations, and roles"
      />

      <Tabs defaultValue="departments">
        <TabsList className="mb-4">
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="designations" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Designations
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        {/* Departments */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Departments</CardTitle>
              <Button onClick={() => setIsDeptDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="font-mono">{dept.code}</TableCell>
                      <TableCell>{dept.employeeCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dept.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designations */}
        <TabsContent value="designations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Designations</CardTitle>
              <Button onClick={() => setIsDesDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Designation
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designations.map((des) => (
                    <TableRow key={des.id}>
                      <TableCell className="font-medium">{des.name}</TableCell>
                      <TableCell className="font-mono">{des.code}</TableCell>
                      <TableCell>{des.level}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Roles & Permissions</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Admin</TableCell>
                    <TableCell className="text-muted-foreground">
                      Full system access
                    </TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">HR Manager</TableCell>
                    <TableCell className="text-muted-foreground">
                      Manage employees, leaves, and payroll
                    </TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Manager</TableCell>
                    <TableCell className="text-muted-foreground">
                      Approve leaves, view team attendance
                    </TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Employee</TableCell>
                    <TableCell className="text-muted-foreground">
                      Self-service access only
                    </TableCell>
                    <TableCell>105</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g., Engineering" />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="e.g., ENG" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Brief description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDept}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={isDesDialogOpen} onOpenChange={setIsDesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Designation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g., Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="e.g., SWE" />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input type="number" placeholder="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
