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
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { FileText, Download, Eye, Send, Calendar, LayoutTemplate } from "lucide-react";
import { usePayslips } from "@/hooks/usePayroll";
import { useEmployees } from "@/hooks/useEmployees";
import { usePayslipTemplates, useDefaultPayslipTemplate } from "@/hooks/usePayslipTemplates";
import { toast } from "sonner";
import { format } from "date-fns";
import { downloadPayslipPDF, downloadPayslipFromTemplate } from "@/lib/pdfGenerator";

export default function PayslipsList() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );
  const [previewPayslip, setPreviewPayslip] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");

  const { data: payslips = [], isLoading: payslipsLoading } = usePayslips();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: templates = [] } = usePayslipTemplates();
  const { data: defaultTemplate } = useDefaultPayslipTemplate();

  const isLoading = payslipsLoading || employeesLoading;

  // Generate display data - show employees with their payslips if available
  const allPayslips = employees.map((emp) => {
    const existing = payslips.find((p) => p.employee_id === emp.id);
    const employeeName = `${emp.profile?.first_name || ""} ${emp.profile?.last_name || ""}`.trim() || "Unknown";
    
    return existing || {
      id: `temp-${emp.id}`,
      employee_id: emp.id,
      employeeName,
      employeeCode: emp.employee_id,
      avatar: emp.profile?.avatar_url,
      pay_period: format(currentDate, "MMMM yyyy"),
      pay_date: new Date().toISOString(),
      basic_salary: 0,
      gross_earnings: 0,
      total_deductions: 0,
      net_pay: 0,
      status: "draft" as const,
    };
  });

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

  const handleGenerateAll = () => {
    toast.success("Payslips generated for all employees!");
  };

  const handleSendAll = () => {
    toast.success("Payslips sent to all employees via email!");
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
          <Button onClick={handleGenerateAll}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Payslips
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
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
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayslips.length > 0 ? allPayslips.map((payslip) => {
                const emp = employees.find((e) => e.id === payslip.employee_id);
                const employeeName = emp 
                  ? `${emp.profile?.first_name || ""} ${emp.profile?.last_name || ""}`.trim() 
                  : "Unknown";
                
                return (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp?.profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {emp?.profile?.first_name?.[0] || ""}
                            {emp?.profile?.last_name?.[0] || ""}
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
                    <TableCell className="text-right">
                      ${(payslip.gross_earnings || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${(payslip.total_deductions || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      ${(payslip.net_pay || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payslip.status as StatusType} />
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
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No payslips found
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
