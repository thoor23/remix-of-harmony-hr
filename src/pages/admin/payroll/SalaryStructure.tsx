import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Calculator, DollarSign, TrendingUp, Users } from "lucide-react";
import { employees, salaryStructures } from "@/data/mockData";
import { toast } from "sonner";

export default function SalaryStructure() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  // Form state
  const [basic, setBasic] = useState("50000");
  const [hra, setHra] = useState("20000");
  const [conveyance, setConveyance] = useState("3000");
  const [medical, setMedical] = useState("2500");
  const [special, setSpecial] = useState("10000");
  const [other, setOther] = useState("2000");
  const [pf, setPf] = useState("6000");
  const [esi, setEsi] = useState("1313");
  const [pt, setPt] = useState("200");
  const [tax, setTax] = useState("8750");

  const grossSalary = Number(basic) + Number(hra) + Number(conveyance) + Number(medical) + Number(special) + Number(other);
  const totalDeductions = Number(pf) + Number(esi) + Number(pt) + Number(tax);
  const netSalary = grossSalary - totalDeductions;

  const handleSave = () => {
    toast.success("Salary structure saved successfully!");
    setIsDialogOpen(false);
  };

  const handleEdit = (empId: string) => {
    setSelectedEmployee(empId);
    setIsDialogOpen(true);
  };

  // Create salary data for display
  const employeeSalaries = employees.map((emp) => {
    const structure = salaryStructures.find((s) => s.employeeId === emp.id);
    return {
      ...emp,
      salary: structure || {
        grossSalary: 75000,
        totalDeductions: 12000,
        netSalary: 63000,
        effectiveFrom: "2024-01-01",
      },
    };
  });

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Payroll", href: "/admin/payroll/structure" },
          { label: "Salary Structure" },
        ]}
      />

      <PageHeader
        title="Salary Structure"
        description="Manage employee salary components and structures"
      >
        <Button onClick={() => { setSelectedEmployee(null); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Structure
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">$875K</p>
              <p className="text-sm text-muted-foreground">Monthly Payroll</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">$70K</p>
              <p className="text-sm text-muted-foreground">Avg. Salary</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">+5%</p>
              <p className="text-sm text-muted-foreground">YoY Growth</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Salary Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeSalaries.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={emp.avatar} />
                        <AvatarFallback>
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.department.name}</TableCell>
                  <TableCell>{emp.designation.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${emp.salary.grossSalary.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${emp.salary.totalDeductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    ${emp.salary.netSalary.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.salary.effectiveFrom}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(emp.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? "Edit Salary Structure" : "Add Salary Structure"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {!selectedEmployee && (
              <div className="space-y-2">
                <Label>Select Employee</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Earnings */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-primary">Earnings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Basic Salary</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={basic}
                      onChange={(e) => setBasic(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">HRA</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={hra}
                      onChange={(e) => setHra(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Conveyance</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={conveyance}
                      onChange={(e) => setConveyance(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Medical Allowance</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={medical}
                      onChange={(e) => setMedical(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Special Allowance</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={special}
                      onChange={(e) => setSpecial(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Other Allowances</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Gross Salary</span>
                    <span className="font-semibold text-primary">
                      ${grossSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-destructive">Deductions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Provident Fund (PF)</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={pf}
                      onChange={(e) => setPf(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">ESI</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={esi}
                      onChange={(e) => setEsi(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Professional Tax</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={pt}
                      onChange={(e) => setPt(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Income Tax (TDS)</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Total Deductions</span>
                    <span className="font-semibold text-destructive">
                      ${totalDeductions.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="p-4 bg-primary/5 rounded-lg mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Net Salary</span>
                    <span className="text-2xl font-bold text-primary">
                      ${netSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input type="date" className="w-48" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Structure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
