import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { exportToCSV, ColumnDef } from "@/lib/csvExport";
import { FileText, Download, Eye, Send, Calendar, LayoutTemplate, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { usePayslips, useSalaryStructures } from "@/hooks/usePayroll";
import { useEmployees } from "@/hooks/useEmployees";
import { usePayslipTemplates, useDefaultPayslipTemplate } from "@/hooks/usePayslipTemplates";
import { toast } from "sonner";
import { format } from "date-fns";
import { downloadPayslipPDF, downloadPayslipFromTemplate } from "@/lib/pdfGenerator";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function PayslipsList() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );
  const [previewPayslip, setPreviewPayslip] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  
  // Table state
  const [sortColumn, setSortColumn] = useState<string>("employeeName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "employee", header: "Employee", visible: true },
    { id: "gross_earnings", header: "Gross Earnings", visible: true },
    { id: "total_deductions", header: "Deductions", visible: true },
    { id: "net_pay", header: "Net Pay", visible: true },
    { id: "status", header: "Status", visible: true },
    { id: "actions", header: "Actions", visible: true },
  ]);

  const { data: payslips = [], isLoading: payslipsLoading, isFetching, refetch: refetchPayslips } = usePayslips();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: salaryStructures = [] } = useSalaryStructures();
  const { data: templates = [] } = usePayslipTemplates();
  const { data: defaultTemplate } = useDefaultPayslipTemplate();

  const isLoading = payslipsLoading || employeesLoading;

  // Generate display data - show employees with their payslips if available
  const allPayslips = useMemo(() => {
    return employees.map((emp) => {
      const existing = payslips.find((p) => p.employee_id === emp.id);
      const employeeName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown";
      
      return existing || {
        id: `temp-${emp.id}`,
        employee_id: emp.id,
        employeeName,
        employeeCode: emp.employee_id,
        avatar: emp.avatar_url,
        pay_period: format(currentDate, "MMMM yyyy"),
        pay_date: new Date().toISOString(),
        basic_salary: 0,
        gross_earnings: 0,
        total_deductions: 0,
        net_pay: 0,
        status: "draft" as const,
      };
    });
  }, [employees, payslips, currentDate]);

  const filteredPayslips = useMemo(() => {
    return allPayslips.filter(payslip => {
      const emp = employees.find((e) => e.id === payslip.employee_id);
      const employeeName = emp 
        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() 
        : "Unknown";
      return employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             emp?.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [allPayslips, employees, searchQuery]);

  const sortedPayslips = useMemo(() => {
    return [...filteredPayslips].sort((a, b) => {
      let aVal: any, bVal: any;
      const empA = employees.find(e => e.id === a.employee_id);
      const empB = employees.find(e => e.id === b.employee_id);
      
      switch (sortColumn) {
        case "employee":
        case "employeeName":
          aVal = `${empA?.first_name || ""} ${empA?.last_name || ""}`.trim();
          bVal = `${empB?.first_name || ""} ${empB?.last_name || ""}`.trim();
          break;
        case "gross_earnings":
          aVal = a.gross_earnings || 0;
          bVal = b.gross_earnings || 0;
          break;
        case "total_deductions":
          aVal = a.total_deductions || 0;
          bVal = b.total_deductions || 0;
          break;
        case "net_pay":
          aVal = a.net_pay || 0;
          bVal = b.net_pay || 0;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredPayslips, sortColumn, sortDirection, employees]);

  const pagination = usePagination({ data: sortedPayslips, defaultPageSize: 10 });
  const paginatedItems = pagination.paginatedData;

  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = format(date, "MMMM yyyy");
      options.push({ value, label });
    }
    return options;
  };

  const handleGenerateAll = async () => {
    if (salaryStructures.length === 0) {
      toast.error("No salary structures found. Please set up salary structures first.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const payPeriod = format(new Date(selectedMonth + "-01"), "MMMM yyyy");
      const result = await api.post<{ generated: number; skipped: number; message: string }>(
        '/payroll/payslips/generate-all',
        { pay_period: payPeriod, pay_date: new Date().toISOString().split('T')[0] }
      );
      toast.success(result.message);
      refetchPayslips();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate payslips");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAll = () => {
    toast.success("Payslips sent to all employees via email!");
  };

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
    setSelectedRows(checked ? paginatedItems.map((p) => p.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(r => r !== id));
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
  };

  const handleExport = () => {
    const data = sortedPayslips.map(p => {
      const emp = employees.find(e => e.id === p.employee_id);
      return {
        employee: `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim(),
        employee_id: emp?.employee_id || "",
        gross_earnings: p.gross_earnings || 0,
        total_deductions: p.total_deductions || 0,
        net_pay: p.net_pay || 0,
        status: p.status,
      };
    });
    exportToCSV(data, columns, "payslips");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["payslips"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Payslips"
        description="Generate and manage employee payslips"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSendAll}>
            <Send className="mr-2 h-4 w-4" />
            Send All
          </Button>
          <Button onClick={handleGenerateAll} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FileText className="mr-2 h-4 w-4" />
            Generate Payslips
          </Button>
        </div>
      </PageHeader>

      {/* Payslips Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilter(!showFilter)}
          showFilter={showFilter}
          isRefreshing={isFetching}
        />

        {showFilter && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Pay Period:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Template:</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Template</SelectItem>
                    {templates.filter(t => t.is_active).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} {template.is_default && "(Default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                {columns.find(c => c.id === "gross_earnings")?.visible && (
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("gross_earnings")}>
                    <div className="flex items-center justify-end">Gross Earnings {getSortIcon("gross_earnings")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "total_deductions")?.visible && (
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("total_deductions")}>
                    <div className="flex items-center justify-end">Deductions {getSortIcon("total_deductions")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "net_pay")?.visible && (
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort("net_pay")}>
                    <div className="flex items-center justify-end">Net Pay {getSortIcon("net_pay")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "status")?.visible && (
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">Status {getSortIcon("status")}</div>
                  </TableHead>
                )}
                {columns.find(c => c.id === "actions")?.visible && (
                  <TableHead className="w-32">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? paginatedItems.map((payslip) => {
                const emp = employees.find((e) => e.id === payslip.employee_id);
                const employeeName = emp 
                  ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() 
                  : "Unknown";
                
                return (
                  <TableRow key={payslip.id} data-state={selectedRows.includes(payslip.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(payslip.id)}
                        onCheckedChange={(checked) => handleSelectRow(payslip.id, !!checked)}
                      />
                    </TableCell>
                    {columns.find(c => c.id === "employee")?.visible && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp?.avatar_url || ""} />
                            <AvatarFallback>
                              {emp?.first_name?.[0] || ""}
                              {emp?.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp?.employee_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "gross_earnings")?.visible && (
                      <TableCell className="text-right">
                        ${(payslip.gross_earnings || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "total_deductions")?.visible && (
                      <TableCell className="text-right text-muted-foreground">
                        ${(payslip.total_deductions || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "net_pay")?.visible && (
                      <TableCell className="text-right font-semibold text-primary">
                        ${(payslip.net_pay || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "status")?.visible && (
                      <TableCell>
                        <StatusBadge status={payslip.status as StatusType} />
                      </TableCell>
                    )}
                    {columns.find(c => c.id === "actions")?.visible && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewPayslip(payslip)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              const selectedTemplate = selectedTemplateId !== "default" 
                                ? templates.find(t => t.id === selectedTemplateId) 
                                : defaultTemplate;
                              
                              if (selectedTemplate) {
                                downloadPayslipFromTemplate({
                                  employeeName,
                                  employeeId: emp?.employee_id || "",
                                  department: emp?.department?.name || "N/A",
                                  designation: emp?.designation?.name || "N/A",
                                  payPeriod: payslip.pay_period,
                                  payDate: payslip.pay_date || new Date().toISOString(),
                                  basicSalary: payslip.basic_salary || 0,
                                  grossEarnings: payslip.gross_earnings || 0,
                                  totalDeductions: payslip.total_deductions || 0,
                                  netPay: payslip.net_pay || 0,
                                  companyName: selectedTemplate.company_name || "Company Name Inc.",
                                  companyAddress: selectedTemplate.company_address || "123 Business Street",
                                  templateContent: selectedTemplate.content,
                                  footerText: selectedTemplate.footer_text || undefined,
                                });
                              } else {
                                downloadPayslipPDF({
                                  employeeName,
                                  employeeId: emp?.employee_id || "",
                                  department: emp?.department?.name || "N/A",
                                  designation: emp?.designation?.name || "N/A",
                                  payPeriod: payslip.pay_period,
                                  payDate: payslip.pay_date || new Date().toISOString(),
                                  basicSalary: payslip.basic_salary || 0,
                                  grossEarnings: payslip.gross_earnings || 0,
                                  totalDeductions: payslip.total_deductions || 0,
                                  netPay: payslip.net_pay || 0,
                                  companyName: "Company Name Inc.",
                                  companyAddress: "123 Business Street, San Francisco, CA 94102",
                                });
                              }
                              toast.success("Payslip PDF downloaded");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No payslips found
                  </TableCell>
                </TableRow>
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

      {/* Payslip Preview Dialog */}
      <Dialog open={!!previewPayslip} onOpenChange={() => setPreviewPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Preview</DialogTitle>
          </DialogHeader>

          {previewPayslip && (
            <div className="space-y-6 py-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">Company Name Inc.</h3>
                  <p className="text-sm text-muted-foreground">
                    123 Business Street, San Francisco, CA 94102
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Payslip</p>
                  <p className="text-sm text-muted-foreground">
                    {previewPayslip.pay_period}
                  </p>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-primary">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span>${(previewPayslip.basic_salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Gross Earnings</span>
                      <span>${(previewPayslip.gross_earnings || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-destructive">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Deductions</span>
                      <span>${(previewPayslip.total_deductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Pay</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(previewPayslip.net_pay || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPayslip(null)}>
              Close
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
