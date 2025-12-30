import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Eye, FileText, Wallet, TrendingUp, Loader2 } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyPayslips } from "@/hooks/usePayroll";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { format } from "date-fns";
import { toast } from "sonner";
import { generatePayslipPDF } from "@/lib/payslipPdfGenerator";

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

export default function EmployeePayslips() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [previewPayslip, setPreviewPayslip] = useState<PayslipDetail | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: currentEmployee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: payslips = [], isLoading: payslipsLoading } = useMyPayslips(currentEmployee?.id || "");
  const { data: branding } = useCompanyBranding();

  const isLoading = employeeLoading || payslipsLoading;

  // Filter payslips by selected year
  const filteredPayslips = payslips.filter((p) => {
    const year = p.pay_period.split("-")[0];
    return year === selectedYear;
  });

  const totalEarnings = filteredPayslips.reduce((sum, p) => sum + p.net_pay, 0);
  const avgSalary = filteredPayslips.length > 0 ? totalEarnings / filteredPayslips.length : 0;

  const handleDownload = async (payslip: PayslipDetail) => {
    setDownloading(payslip.id);
    
    try {
      const employeeName = `${currentEmployee?.profile?.first_name || ""} ${currentEmployee?.profile?.last_name || ""}`.trim();
      
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

      {/* Year Filter */}
      <div className="flex items-center gap-4 mb-4">
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
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay Period</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">{formatPayPeriod(payslip.pay_period)}</TableCell>
                  <TableCell className="text-right">
                    ${payslip.gross_earnings.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${payslip.total_deductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    ${payslip.net_pay.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(payslip.pay_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payslip.status as "paid" | "generated" | "pending"} />
                  </TableCell>
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
              {filteredPayslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payslips found for {selectedYear}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payslip Preview Dialog */}
      <Dialog open={!!previewPayslip} onOpenChange={() => setPreviewPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip - {previewPayslip && formatPayPeriod(previewPayslip.pay_period)}</DialogTitle>
          </DialogHeader>

          {previewPayslip && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">Company Name Inc.</h3>
                  <p className="text-sm text-muted-foreground">
                    123 Business Street, San Francisco, CA 94102
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Payslip</p>
                  <p className="text-sm text-muted-foreground">{formatPayPeriod(previewPayslip.pay_period)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee Name</p>
                  <p className="font-medium">
                    {currentEmployee?.profile?.first_name} {currentEmployee?.profile?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pay Date</p>
                  <p className="font-medium">{format(new Date(previewPayslip.pay_date), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-primary">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span>${previewPayslip.basic_salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances</span>
                      <span>${(previewPayslip.gross_earnings - previewPayslip.basic_salary).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Gross Earnings</span>
                      <span>${previewPayslip.gross_earnings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-destructive">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Deductions</span>
                      <span>${previewPayslip.total_deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Deductions</span>
                      <span>${previewPayslip.total_deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Pay</span>
                  <span className="text-2xl font-bold text-primary">
                    ${previewPayslip.net_pay.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPayslip(null)}>
              Close
            </Button>
            <Button 
              onClick={() => previewPayslip && handleDownload(previewPayslip)}
              disabled={downloading === previewPayslip?.id}
            >
              {downloading === previewPayslip?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
