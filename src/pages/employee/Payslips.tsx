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
import { Download, Eye, FileText, Wallet, TrendingUp } from "lucide-react";
import { payslips } from "@/data/mockData";
import { Payslip } from "@/types/hrms";
import { toast } from "sonner";

export default function EmployeePayslips() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [previewPayslip, setPreviewPayslip] = useState<Payslip | null>(null);

  // Generate mock payslips for the year
  const myPayslips: Payslip[] = Array.from({ length: 12 }, (_, i) => {
    const month = 12 - i;
    const existing = payslips.find((p) => p.employeeId === "emp-3" && p.month === month);
    return existing || {
      id: `ps-${month}`,
      employeeId: "emp-3",
      employeeName: "Michael Chen",
      month,
      year: 2024,
      payPeriod: new Date(2024, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      basic: 50000,
      hra: 20000,
      conveyance: 3000,
      medicalAllowance: 2500,
      specialAllowance: 10000,
      otherAllowances: 2000,
      grossEarnings: 87500,
      pf: 6000,
      esi: 1313,
      professionalTax: 200,
      incomeTax: 8750,
      otherDeductions: 0,
      totalDeductions: 16263,
      netPay: 71237,
      paidDays: 30,
      lopDays: 0,
      status: month <= 11 ? "paid" : "generated",
      generatedOn: new Date(2024, month - 1, 28).toISOString(),
      paidOn: month <= 11 ? new Date(2024, month - 1, 30).toISOString() : undefined,
    };
  });

  const totalEarnings = myPayslips.reduce((sum, p) => sum + p.netPay, 0);
  const avgSalary = totalEarnings / myPayslips.length;

  const handleDownload = (payslip: Payslip) => {
    toast.success(`Downloading payslip for ${payslip.payPeriod}`);
  };

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
              <p className="text-2xl font-semibold">${avgSalary.toLocaleString()}</p>
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
              <p className="text-2xl font-semibold">${totalEarnings.toLocaleString()}</p>
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
              <p className="text-2xl font-semibold">{myPayslips.length}</p>
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
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
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
                <TableHead className="text-center">Paid Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPayslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">{payslip.payPeriod}</TableCell>
                  <TableCell className="text-right">
                    ${payslip.grossEarnings.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${payslip.totalDeductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    ${payslip.netPay.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">{payslip.paidDays}</TableCell>
                  <TableCell>
                    <StatusBadge status={payslip.status} />
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
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payslip Preview Dialog */}
      <Dialog open={!!previewPayslip} onOpenChange={() => setPreviewPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip - {previewPayslip?.payPeriod}</DialogTitle>
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
                  <p className="text-sm text-muted-foreground">{previewPayslip.payPeriod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee Name</p>
                  <p className="font-medium">{previewPayslip.employeeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid Days</p>
                  <p className="font-medium">{previewPayslip.paidDays}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-primary">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span>${previewPayslip.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA</span>
                      <span>${previewPayslip.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conveyance</span>
                      <span>${previewPayslip.conveyance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical Allowance</span>
                      <span>${previewPayslip.medicalAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Allowance</span>
                      <span>${previewPayslip.specialAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Gross Earnings</span>
                      <span>${previewPayslip.grossEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-destructive">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Provident Fund</span>
                      <span>${previewPayslip.pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ESI</span>
                      <span>${previewPayslip.esi.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional Tax</span>
                      <span>${previewPayslip.professionalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Income Tax</span>
                      <span>${previewPayslip.incomeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Deductions</span>
                      <span>${previewPayslip.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Pay</span>
                  <span className="text-2xl font-bold text-primary">
                    ${previewPayslip.netPay.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPayslip(null)}>
              Close
            </Button>
            <Button onClick={() => previewPayslip && handleDownload(previewPayslip)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
