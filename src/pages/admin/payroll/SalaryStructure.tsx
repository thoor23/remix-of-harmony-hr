import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Calculator, DollarSign, TrendingUp, Users } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalaryStructures, useCreateSalaryStructure, useUpdateSalaryStructure } from "@/hooks/usePayroll";
import { format } from "date-fns";

export default function SalaryStructure() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  
  // Form state
  const [basic, setBasic] = useState("50000");
  const [hra, setHra] = useState("20000");
  const [transport, setTransport] = useState("3000");
  const [medical, setMedical] = useState("2500");
  const [other, setOther] = useState("2000");
  const [pf, setPf] = useState("6000");
  const [tax, setTax] = useState("8750");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: salaryStructures = [], isLoading: structuresLoading } = useSalaryStructures();
  const createSalaryStructure = useCreateSalaryStructure();
  const updateSalaryStructure = useUpdateSalaryStructure();

  const isLoading = employeesLoading || structuresLoading;

  const grossSalary = Number(basic) + Number(hra) + Number(transport) + Number(medical) + Number(other);
  const totalDeductions = Number(pf) + Number(tax) + Number(otherDeductions);
  const netSalary = grossSalary - totalDeductions;

  const resetForm = () => {
    setBasic("50000");
    setHra("20000");
    setTransport("3000");
    setMedical("2500");
    setOther("2000");
    setPf("6000");
    setTax("8750");
    setOtherDeductions("0");
    setEffectiveFrom(new Date().toISOString().split("T")[0]);
    setSelectedEmployee(null);
    setEditingStructureId(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (structureId: string) => {
    const structure = salaryStructures.find(s => s.id === structureId);
    if (structure) {
      setEditingStructureId(structureId);
      setSelectedEmployee(structure.employee_id);
      setBasic(structure.basic_salary.toString());
      setHra((structure.hra || 0).toString());
      setTransport((structure.transport_allowance || 0).toString());
      setMedical((structure.medical_allowance || 0).toString());
      setOther((structure.other_allowances || 0).toString());
      setPf((structure.pf_deduction || 0).toString());
      setTax((structure.tax_deduction || 0).toString());
      setOtherDeductions((structure.other_deductions || 0).toString());
      setEffectiveFrom(structure.effective_from);
      setIsDialogOpen(true);
    }
  };

  const handleSave = () => {
    if (!selectedEmployee) return;

    const data = {
      employee_id: selectedEmployee,
      basic_salary: Number(basic),
      hra: Number(hra),
      transport_allowance: Number(transport),
      medical_allowance: Number(medical),
      other_allowances: Number(other),
      pf_deduction: Number(pf),
      tax_deduction: Number(tax),
      other_deductions: Number(otherDeductions),
      effective_from: effectiveFrom,
    };

    if (editingStructureId) {
      updateSalaryStructure.mutate(
        { id: editingStructureId, data },
        { onSuccess: () => { setIsDialogOpen(false); resetForm(); } }
      );
    } else {
      createSalaryStructure.mutate(data, {
        onSuccess: () => { setIsDialogOpen(false); resetForm(); },
      });
    }
  };

  // Map employees with their salary structures
  const employeeSalaries = employees.map((emp) => {
    const structure = salaryStructures.find((s) => s.employee_id === emp.id);
    const empGross = structure 
      ? (structure.basic_salary || 0) + (structure.hra || 0) + (structure.transport_allowance || 0) + 
        (structure.medical_allowance || 0) + (structure.other_allowances || 0)
      : 0;
    const empDeductions = structure
      ? (structure.pf_deduction || 0) + (structure.tax_deduction || 0) + (structure.other_deductions || 0)
      : 0;
    return {
      ...emp,
      structure,
      grossSalary: empGross,
      totalDeductions: empDeductions,
      netSalary: empGross - empDeductions,
    };
  });

  const totalMonthlyPayroll = employeeSalaries.reduce((sum, e) => sum + e.netSalary, 0);
  const avgSalary = employeeSalaries.length > 0 
    ? totalMonthlyPayroll / employeeSalaries.filter(e => e.structure).length 
    : 0;

  const getEmployeeName = (emp: typeof employees[0]) => {
    const profile = emp.profile;
    if (!profile) return emp.employee_id;
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || emp.employee_id;
  };

  const getEmployeeInitials = (emp: typeof employees[0]) => {
    const profile = emp.profile;
    if (!profile) return emp.employee_id.slice(0, 2).toUpperCase();
    return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Salary Structure" description="Manage employee salary components" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
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
        title="Salary Structure"
        description="Manage employee salary components and structures"
      >
        <Button onClick={handleAdd}>
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
              <p className="text-2xl font-semibold">${totalMonthlyPayroll.toLocaleString()}</p>
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
              <p className="text-2xl font-semibold">${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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
              <p className="text-2xl font-semibold">{salaryStructures.length}</p>
              <p className="text-sm text-muted-foreground">Structures Defined</p>
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
                        <AvatarImage src={emp.profile?.avatar_url || undefined} />
                        <AvatarFallback>{getEmployeeInitials(emp)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getEmployeeName(emp)}</p>
                        <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.department?.name || "—"}</TableCell>
                  <TableCell>{emp.designation?.name || "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {emp.structure ? `$${emp.grossSalary.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {emp.structure ? `$${emp.totalDeductions.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {emp.structure ? `$${emp.netSalary.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.structure ? format(new Date(emp.structure.effective_from), "MMM dd, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {emp.structure ? (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(emp.structure!.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelectedEmployee(emp.id); setIsDialogOpen(true); }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStructureId ? "Edit Salary Structure" : "Add Salary Structure"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {!editingStructureId && (
              <div className="space-y-2">
                <Label>Select Employee</Label>
                <Select value={selectedEmployee || ""} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => !salaryStructures.some(s => s.employee_id === emp.id))
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {getEmployeeName(emp)} ({emp.employee_id})
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
                    <Label className="text-sm">Transport Allowance</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
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
                    <Label className="text-sm">Tax Deduction</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Other Deductions</Label>
                    <Input
                      type="number"
                      className="w-32 text-right"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(e.target.value)}
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
              <Input 
                type="date" 
                className="w-48"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!selectedEmployee || createSalaryStructure.isPending || updateSalaryStructure.isPending}
            >
              Save Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
