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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FileText, Download, Eye, Send, Calendar } from "lucide-react";
import { employees, payslips } from "@/data/mockData";
import { Payslip } from "@/types/hrms";
import { toast } from "sonner";

export default function PayslipsList() {
  const [selectedMonth, setSelectedMonth] = useState("2024-12");
  const [previewPayslip, setPreviewPayslip] = useState<Payslip | null>(null);

  // Generate payslips for all employees for display
  const allPayslips = employees.map((emp) => {
    const existing = payslips.find((p) => p.employeeId === emp.id);
    return existing || {
      id: `ps-${emp.id}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      month: 12,
      year: 2024,
      payPeriod: "December 2024",
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
      paidDays: 31,
      lopDays: 0,
      status: "generated" as const,
      generatedOn: "2024-12-28T10:00:00Z",
    };
  });

  const handleGenerateAll = () => {
    toast.success("Payslips generated for all employees!");
  };

  const handleSendAll = () => {
    toast.success("Payslips sent to all employees via email!");
  };

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
          <Button onClick={handleGenerateAll}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Payslips
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Pay Period:</span>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-12">December 2024</SelectItem>
              <SelectItem value="2024-11">November 2024</SelectItem>
              <SelectItem value="2024-10">October 2024</SelectItem>
              <SelectItem value="2024-09">September 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payslips - {selectedMonth === "2024-12" ? "December 2024" : selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-center">Paid Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayslips.map((payslip) => {
                const emp = employees.find((e) => e.id === payslip.employeeId);
                return (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp?.avatar} />
                          <AvatarFallback>
                            {payslip.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payslip.employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp?.employeeId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${payslip.grossEarnings.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${payslip.totalDeductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      ${payslip.netPay.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {payslip.paidDays}
                      {payslip.lopDays > 0 && (
                        <span className="text-destructive text-xs ml-1">
                          (-{payslip.lopDays} LOP)
                        </span>
                      )}
                    </TableCell>
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
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
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
                    {previewPayslip.payPeriod}
                  </p>
                </div>
              </div>

              {/* Employee Info */}
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

              {/* Earnings & Deductions */}
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
                    <div className="flex justify-between">
                      <span>Other Allowances</span>
                      <span>${previewPayslip.otherAllowances.toLocaleString()}</span>
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
                      <span>Income Tax (TDS)</span>
                      <span>${previewPayslip.incomeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Deductions</span>
                      <span>${previewPayslip.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
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
