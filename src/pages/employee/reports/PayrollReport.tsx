import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { AreaChartCard } from "@/components/reports/charts/AreaChartCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyPayslips } from "@/hooks/usePayroll";
import { format } from "date-fns";
import { useMemo } from "react";

export default function EmployeePayrollReport() {
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: payslips = [] } = useMyPayslips(currentEmployee?.id || "");

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEarnings = payslips.reduce((sum, p) => sum + p.gross_earnings, 0);
    const totalDeductions = payslips.reduce((sum, p) => sum + p.total_deductions, 0);
    const latestNetPay = payslips[0]?.net_pay || 0;
    const avgMonthly = payslips.length > 0 ? Math.round(totalEarnings / payslips.length) : 0;

    return { totalEarnings, totalDeductions, latestNetPay, avgMonthly };
  }, [payslips]);

  // Monthly earnings trend
  const monthlyTrend = useMemo(() => {
    return payslips.slice(0, 12).reverse().map(p => ({
      name: format(new Date(p.pay_date), "MMM"),
      gross: p.gross_earnings,
      net: p.net_pay,
    }));
  }, [payslips]);

  // Latest payslip breakdown
  const latestBreakdown = useMemo(() => {
    const latest = payslips[0];
    if (!latest) return [];
    return [
      { name: "Basic Salary", value: latest.basic_salary, fill: "hsl(var(--chart-1))" },
      { name: "Allowances", value: latest.gross_earnings - latest.basic_salary, fill: "hsl(var(--chart-2))" },
    ].filter(item => item.value > 0);
  }, [payslips]);

  // Deductions breakdown
  const deductionsBreakdown = useMemo(() => {
    const latest = payslips[0];
    if (!latest || latest.total_deductions === 0) return [];
    return [
      { name: "Deductions", value: latest.total_deductions, fill: "hsl(var(--chart-3))" },
    ];
  }, [payslips]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  const exportData = {
    headers: ["Pay Period", "Pay Date", "Basic", "Gross", "Deductions", "Net Pay", "Status"],
    rows: payslips.map(p => [
      p.pay_period,
      format(new Date(p.pay_date), "dd MMM yyyy"),
      formatCurrency(p.basic_salary),
      formatCurrency(p.gross_earnings),
      formatCurrency(p.total_deductions),
      formatCurrency(p.net_pay),
      p.status,
    ]),
    filename: "my-payroll-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Payroll Report"
        description="Track your earnings and payslip history"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Payroll Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Earnings (YTD)"
          value={formatCurrency(stats.totalEarnings)}
          icon={Wallet}
        />
        <StatCard
          title="Latest Net Pay"
          value={formatCurrency(stats.latestNetPay)}
          icon={Receipt}
        />
        <StatCard
          title="Total Deductions"
          value={formatCurrency(stats.totalDeductions)}
          icon={TrendingDown}
        />
        <StatCard
          title="Avg. Monthly"
          value={formatCurrency(stats.avgMonthly)}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AreaChartCard
          title="Monthly Earnings Trend"
          data={monthlyTrend}
          areas={[
            { dataKey: "gross", name: "Gross Earnings" },
            { dataKey: "net", name: "Net Pay" },
          ]}
        />
        <PieChartCard
          title="Earnings Breakdown (Latest)"
          data={latestBreakdown}
          showLegend
        />
      </div>

      {/* Payslip History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay Period</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No payslips found
                  </TableCell>
                </TableRow>
              ) : (
                payslips.slice(0, 12).map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">{payslip.pay_period}</TableCell>
                    <TableCell>{format(new Date(payslip.pay_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payslip.basic_salary)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payslip.gross_earnings)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payslip.total_deductions)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payslip.net_pay)}</TableCell>
                    <TableCell className="capitalize">{payslip.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
