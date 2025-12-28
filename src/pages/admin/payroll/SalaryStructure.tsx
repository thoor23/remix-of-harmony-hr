import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { StatCard } from "@/components/shared/StatCard";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { 
  Plus, 
  Edit, 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalaryStructures, useCreateSalaryStructure, useUpdateSalaryStructure } from "@/hooks/usePayroll";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function SalaryStructure() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  
  // Table state
  const [sortColumn, setSortColumn] = useState<string>("employee");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "employee", header: "Employee", visible: true },
    { id: "department", header: "Department", visible: true },
    { id: "designation", header: "Designation", visible: true },
    { id: "gross_salary", header: "Gross Salary", visible: true },
    { id: "deductions", header: "Deductions", visible: true },
    { id: "net_salary", header: "Net Salary", visible: true },
    { id: "effective_from", header: "Effective From", visible: true },
    { id: "actions", header: "Actions", visible: true },
  ]);
  
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
  const { data: salaryStructures = [], isLoading: structuresLoading, isFetching } = useSalaryStructures();
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

  const getEmployeeName = (emp: typeof employees[0]) => {
    if (!emp.first_name && !emp.last_name) return emp.employee_id;
    return `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.employee_id;
  };

  const getEmployeeInitials = (emp: typeof employees[0]) => {
    if (!emp.first_name && !emp.last_name) return emp.employee_id.slice(0, 2).toUpperCase();
    return `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase();
  };

  // Map employees with their salary structures
  const employeeSalaries = useMemo(() => {
    return employees.map((emp) => {
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
        employeeName: getEmployeeName(emp),
      };
    });
  }, [employees, salaryStructures]);

  const filteredSalaries = useMemo(() => {
    return employeeSalaries.filter(emp => 
      emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employeeSalaries, searchQuery]);

  const sortedSalaries = useMemo(() => {
    return [...filteredSalaries].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortColumn) {
        case "employee":
          aVal = a.employeeName;
          bVal = b.employeeName;
          break;
        case "department":
          aVal = a.department?.name || "";
          bVal = b.department?.name || "";
          break;
        case "designation":
          aVal = a.designation?.name || "";
          bVal = b.designation?.name || "";
          break;
        case "gross_salary":
          aVal = a.grossSalary;
          bVal = b.grossSalary;
          break;
        case "deductions":
          aVal = a.totalDeductions;
          bVal = b.totalDeductions;
          break;
        case "net_salary":
          aVal = a.netSalary;
          bVal = b.netSalary;
          break;
        case "effective_from":
          aVal = a.structure?.effective_from ? new Date(a.structure.effective_from).getTime() : 0;
          bVal = b.structure?.effective_from ? new Date(b.structure.effective_from).getTime() : 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredSalaries, sortColumn, sortDirection]);

  const pagination = usePagination({ data: sortedSalaries, defaultPageSize: 10 });
  const paginatedItems = pagination.paginatedData;

  const totalMonthlyPayroll = employeeSalaries.reduce((sum, e) => sum + e.netSalary, 0);
  const avgSalary = employeeSalaries.filter(e => e.structure).length > 0 
    ? totalMonthlyPayroll / employeeSalaries.filter(e => e.structure).length 
    : 0;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedItems.map((e) => e.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id));
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleExport = () => {
    const data = sortedSalaries.map(emp => ({
      employee: emp.employeeName,
      employee_id: emp.employee_id,
      department: emp.department?.name || "-",
      designation: emp.designation?.name || "-",
      gross_salary: emp.grossSalary,
      deductions: emp.totalDeductions,
      net_salary: emp.netSalary,
      effective_from: emp.structure?.effective_from 
        ? format(new Date(emp.structure.effective_from), "yyyy-MM-dd") 
        : "-",
    }));
    exportToCSV(data, columns, "salary-structures");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Salary Structure" description="Manage employee salary components" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard title="Total Employees" value={employees.length} icon={Users} />
        <StatCard 
          title="Monthly Payroll" 
          value={`$${totalMonthlyPayroll.toLocaleString()}`} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Avg. Salary" 
          value={`$${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          icon={Calculator} 
        />
        <StatCard title="Structures Defined" value={salaryStructures.length} icon={TrendingUp} />
      </div>

      {/* Salary Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onAddRow={handleAdd}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
          addRowLabel="Add Structure"
        />

        {showFilter && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedItems.length > 0 && selectedRows.length === paginatedItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {columns.find(c => c.id === "employee")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("employee")}>
                    <div className="flex items-center">Employee {getSortIcon("employee")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "department")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("department")}>
                    <div className="flex items-center">Department {getSortIcon("department")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "designation")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("designation")}>
                    <div className="flex items-center">Designation {getSortIcon("designation")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "gross_salary")?.visible && (
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("gross_salary")}>
                    <div className="flex items-center justify-end">Gross Salary {getSortIcon("gross_salary")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "deductions")?.visible && (
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("deductions")}>
                    <div className="flex items-center justify-end">Deductions {getSortIcon("deductions")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "net_salary")?.visible && (
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("net_salary")}>
                    <div className="flex items-center justify-end">Net Salary {getSortIcon("net_salary")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "effective_from")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("effective_from")}>
                    <div className="flex items-center">Effective From {getSortIcon("effective_from")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "actions")?.visible && (
                  <TableHead className="w-20">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((emp) => (
                  <TableRow key={emp.id} data-state={selectedRows.includes(emp.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(emp.id)}
                        onCheckedChange={(checked) => handleSelectRow(emp.id, !!checked)}
                      />
                    </TableCell>
                    {columns.find(c => c.id === "employee")?.visible && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatar_url || undefined} />
                            <AvatarFallback>{getEmployeeInitials(emp)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "department")?.visible && (
                      <TableCell>{emp.department?.name || "—"}</TableCell>
                    )}
                    {columns.find(c => c.id === "designation")?.visible && (
                      <TableCell>{emp.designation?.name || "—"}</TableCell>
                    )}
                    {columns.find(c => c.id === "gross_salary")?.visible && (
                      <TableCell className="text-right font-medium">
                        {emp.structure ? `$${emp.grossSalary.toLocaleString()}` : "—"}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "deductions")?.visible && (
                      <TableCell className="text-right text-muted-foreground">
                        {emp.structure ? `$${emp.totalDeductions.toLocaleString()}` : "—"}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "net_salary")?.visible && (
                      <TableCell className="text-right font-semibold text-primary">
                        {emp.structure ? `$${emp.netSalary.toLocaleString()}` : "—"}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "effective_from")?.visible && (
                      <TableCell className="text-muted-foreground">
                        {emp.structure ? format(new Date(emp.structure.effective_from), "MMM dd, yyyy") : "—"}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "actions")?.visible && (
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
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
        />
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
