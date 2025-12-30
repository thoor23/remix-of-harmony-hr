import { useState, useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmployeeCell } from "@/components/shared/EmployeeCell";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { TablePagination } from "@/components/shared/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { ColumnDef, exportToCSV } from "@/lib/csvExport";
import { Download, Eye, FileText, Wallet, TrendingUp, Loader2, ArrowUpDown, Search, X } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyPayslips } from "@/hooks/usePayroll";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { format } from "date-fns";
import { toast } from "sonner";
import { generatePayslipPDF } from "@/lib/payslipPdfGenerator";
import { useQueryClient } from "@tanstack/react-query";

interface PayslipDetail {
  id: string;
  pay_period: string;
  pay_date: string;
  basic_salary: number;
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  created_at: string;
}

type SortField = "pay_period" | "gross_earnings" | "total_deductions" | "net_pay" | "pay_date" | "status";
type SortDirection = "asc" | "desc";

export default function EmployeePayslips() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [previewPayslip, setPreviewPayslip] = useState<PayslipDetail | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("pay_period");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const queryClient = useQueryClient();
  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: payslips = [], isLoading: payslipsLoading, isFetching } = useMyPayslips(currentEmployee?.id || "");
  const { data: branding } = useCompanyBranding();

  const isLoading = employeeLoading || payslipsLoading;

  // Column definitions
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "employee", header: "Employee", visible: true },
    { id: "email", header: "Email", visible: true },
    { id: "department", header: "Department", visible: true },
    { id: "store", header: "Store/Location", visible: true },
    { id: "pay_period", header: "Pay Period", visible: true },
    { id: "gross_earnings", header: "Gross Earnings", visible: true },
    { id: "total_deductions", header: "Deductions", visible: true },
    { id: "net_pay", header: "Net Pay", visible: true },
    { id: "pay_date", header: "Pay Date", visible: true },
    { id: "status", header: "Status", visible: true },
  ]);

  const hasActiveFilters = statusFilter !== "all" || searchQuery || selectedYear !== new Date().getFullYear().toString();

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSelectedYear(new Date().getFullYear().toString());
  };

  // Filter payslips by selected year, search, and status
  const filteredPayslips = useMemo(() => {
    let data = payslips.filter((p) => {
      const year = p.pay_period.split("-")[0];
      return year === selectedYear;
    });

    if (statusFilter !== "all") {
      data = data.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      data = data.filter((p) =>
        p.pay_period.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [payslips, selectedYear, statusFilter, searchQuery]);

  // Sort payslips
  const sortedPayslips = useMemo(() => {
    return [...filteredPayslips].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "pay_period":
          aVal = a.pay_period;
          bVal = b.pay_period;
          break;
        case "gross_earnings":
          aVal = a.gross_earnings;
          bVal = b.gross_earnings;
          break;
        case "total_deductions":
          aVal = a.total_deductions;
          bVal = b.total_deductions;
          break;
        case "net_pay":
          aVal = a.net_pay;
          bVal = b.net_pay;
          break;
        case "pay_date":
          aVal = a.pay_date;
          bVal = b.pay_date;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredPayslips, sortField, sortDirection]);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: sortedPayslips, defaultPageSize: 10 });

  const totalEarnings = filteredPayslips.reduce((sum, p) => sum + p.net_pay, 0);
  const avgSalary = filteredPayslips.length > 0 ? totalEarnings / filteredPayslips.length : 0;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-8 flex items-center gap-1 -ml-3 font-medium hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedData.map((p) => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    }
  };

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, visible } : col)));
  };

  const handleExport = () => {
    const dataToExport = selectedRows.length > 0
      ? sortedPayslips.filter((p) => selectedRows.includes(p.id))
      : sortedPayslips;

    const exportData = dataToExport.map((p) => ({
      ...p,
      department: currentEmployee?.department?.name || "-",
      store: currentEmployee?.primary_store?.name || "-",
    }));

    const exportColumns: ColumnDef[] = [
      { id: "pay_period", header: "Pay Period", visible: true },
      { id: "pay_date", header: "Pay Date", visible: true },
      { id: "department", header: "Department", visible: true },
      { id: "store", header: "Store/Location", visible: true },
      { id: "basic_salary", header: "Basic Salary", visible: true },
      { id: "gross_earnings", header: "Gross Earnings", visible: true },
      { id: "total_deductions", header: "Total Deductions", visible: true },
      { id: "net_pay", header: "Net Pay", visible: true },
      { id: "status", header: "Status", visible: true },
    ];

    exportToCSV(exportData, exportColumns, `my-payslips-${selectedYear}`);
    toast.success(`Exported ${dataToExport.length} payslips`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-payslips"] });
  };

  const handleDownload = async (payslip: PayslipDetail) => {
    setDownloading(payslip.id);
    
    try {
      const employeeName = `${currentEmployee?.first_name || ""} ${currentEmployee?.last_name || ""}`.trim();
      
      generatePayslipPDF({
        employee_name: employeeName || "Employee",
        employee_id: currentEmployee?.employee_id || "N/A",
        department: currentEmployee?.department?.name || "N/A",
        designation: currentEmployee?.designation?.name || "N/A",
        pay_period: payslip.pay_period,
        pay_date: payslip.pay_date,
        basic_salary: payslip.basic_salary,
        gross_earnings: payslip.gross_earnings,
        total_deductions: payslip.total_deductions,
        net_pay: payslip.net_pay,
      }, {
        name: branding?.companyName || "Company Name",
        address: "123 Business Street, San Francisco, CA 94102",
      });
      
      toast.success("Payslip downloaded successfully");
    } catch {
      toast.error("Failed to generate payslip");
    } finally {
      setDownloading(null);
    }
  };

  const formatPayPeriod = (period: string) => {
    try {
      const [year, month] = period.split("-");
      return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy");
    } catch {
      return period;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Payslips" description="View and download your monthly payslips" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[...Array(3)].map((_, i) => (
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
      <PageHeader title="My Payslips" description="View and download your monthly payslips" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-muted-foreground">Average Monthly</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">${totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-muted-foreground">YTD Earnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{filteredPayslips.length}</p>
              <p className="text-sm text-muted-foreground">Payslips Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card>
        <DataTableToolbar
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onToggleFilter={() => setShowFilters(!showFilters)}
          showFilter={showFilters}
          isRefreshing={isFetching}
        />

        {showFilters && (
          <div className="p-4 border-b bg-muted/30 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by pay period..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Year Selector */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                  <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                  <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 gap-1.5">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {columns.find((c) => c.id === "employee")?.visible && (
                <TableHead>Employee</TableHead>
              )}
              {columns.find((c) => c.id === "email")?.visible && (
                <TableHead>Email</TableHead>
              )}
              {columns.find((c) => c.id === "department")?.visible && (
                <TableHead>Department</TableHead>
              )}
              {columns.find((c) => c.id === "store")?.visible && (
                <TableHead>Store/Location</TableHead>
              )}
              {columns.find((c) => c.id === "pay_period")?.visible && (
                <TableHead><SortableHeader field="pay_period">Pay Period</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "gross_earnings")?.visible && (
                <TableHead className="text-right"><SortableHeader field="gross_earnings">Gross Earnings</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "total_deductions")?.visible && (
                <TableHead className="text-right"><SortableHeader field="total_deductions">Deductions</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "net_pay")?.visible && (
                <TableHead className="text-right"><SortableHeader field="net_pay">Net Pay</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "pay_date")?.visible && (
                <TableHead><SortableHeader field="pay_date">Pay Date</SortableHeader></TableHead>
              )}
              {columns.find((c) => c.id === "status")?.visible && (
                <TableHead><SortableHeader field="status">Status</SortableHeader></TableHead>
              )}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((payslip) => (
              <TableRow key={payslip.id} data-state={selectedRows.includes(payslip.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(payslip.id)}
                    onCheckedChange={(checked) => handleSelectRow(payslip.id, checked as boolean)}
                  />
                </TableCell>
                {columns.find((c) => c.id === "employee")?.visible && (
                  <TableCell>
                    <EmployeeCell
                      avatarUrl={currentEmployee?.avatar_url}
                      firstName={currentEmployee?.first_name}
                      lastName={currentEmployee?.last_name}
                      employeeId={currentEmployee?.employee_id}
                    />
                  </TableCell>
                )}
                {columns.find((c) => c.id === "email")?.visible && (
                  <TableCell className="text-muted-foreground">{currentEmployee?.email || "-"}</TableCell>
                )}
                {columns.find((c) => c.id === "department")?.visible && (
                  <TableCell>{currentEmployee?.department?.name || "-"}</TableCell>
                )}
                {columns.find((c) => c.id === "store")?.visible && (
                  <TableCell>{currentEmployee?.primary_store?.name || "-"}</TableCell>
                )}
                {columns.find((c) => c.id === "pay_period")?.visible && (
                  <TableCell className="font-medium">{formatPayPeriod(payslip.pay_period)}</TableCell>
                )}
                {columns.find((c) => c.id === "gross_earnings")?.visible && (
                  <TableCell className="text-right">${payslip.gross_earnings.toLocaleString()}</TableCell>
                )}
                {columns.find((c) => c.id === "total_deductions")?.visible && (
                  <TableCell className="text-right text-muted-foreground">${payslip.total_deductions.toLocaleString()}</TableCell>
                )}
                {columns.find((c) => c.id === "net_pay")?.visible && (
                  <TableCell className="text-right font-semibold text-primary">${payslip.net_pay.toLocaleString()}</TableCell>
                )}
                {columns.find((c) => c.id === "pay_date")?.visible && (
                  <TableCell className="text-muted-foreground">{format(new Date(payslip.pay_date), "MMM dd, yyyy")}</TableCell>
                )}
                {columns.find((c) => c.id === "status")?.visible && (
                  <TableCell><StatusBadge status={payslip.status as "paid" | "generated" | "pending"} /></TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setPreviewPayslip(payslip)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(payslip)}
                      disabled={downloading === payslip.id}
                    >
                      {downloading === payslip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No payslips found for {selectedYear}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedPayslips.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewPayslip} onOpenChange={() => setPreviewPayslip(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip Preview</DialogTitle>
          </DialogHeader>

          {previewPayslip && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee</p>
                  <p className="font-medium">{currentEmployee?.first_name} {currentEmployee?.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{currentEmployee?.employee_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pay Period</p>
                  <p className="font-medium">{formatPayPeriod(previewPayslip.pay_period)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pay Date</p>
                  <p className="font-medium">{format(new Date(previewPayslip.pay_date), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span>${previewPayslip.basic_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Earnings</span>
                  <span>${previewPayslip.gross_earnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Total Deductions</span>
                  <span>-${previewPayslip.total_deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-3">
                  <span>Net Pay</span>
                  <span className="text-primary">${previewPayslip.net_pay.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPayslip(null)}>
              Close
            </Button>
            {previewPayslip && (
              <Button onClick={() => handleDownload(previewPayslip)} disabled={downloading === previewPayslip.id}>
                {downloading === previewPayslip.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
