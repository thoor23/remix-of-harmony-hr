import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportExport } from "@/components/reports/ReportExport";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { AreaChartCard } from "@/components/reports/charts/AreaChartCard";
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
import { Wallet, TrendingUp, Receipt, CreditCard } from "lucide-react";
import { useAllLocations } from "@/hooks/useLocations";

const monthlyDisbursementData = [
  { name: "Jul", gross: 850000, net: 720000 },
  { name: "Aug", gross: 865000, net: 732000 },
  { name: "Sep", gross: 880000, net: 745000 },
  { name: "Oct", gross: 895000, net: 758000 },
  { name: "Nov", gross: 920000, net: 775000 },
  { name: "Dec", gross: 950000, net: 800000 },
];

const departmentPayrollData = [
  { name: "Engineering", value: 450000 },
  { name: "Sales", value: 280000 },
  { name: "Marketing", value: 150000 },
  { name: "HR", value: 95000 },
  { name: "Finance", value: 125000 },
];

const earningsBreakdown = [
  { name: "Basic Salary", value: 650000 },
  { name: "HRA", value: 120000 },
  { name: "Bonuses", value: 85000 },
  { name: "Allowances", value: 45000 },
  { name: "Overtime", value: 25000 },
];

const deductionsBreakdown = [
  { name: "Income Tax", value: 95000 },
  { name: "PF Contribution", value: 45000 },
  { name: "Insurance", value: 25000 },
  { name: "Professional Tax", value: 8000 },
  { name: "Other", value: 12000 },
];

const payrollDetails = [
  { employee: "John Smith", department: "Engineering", store: "Main Store", gross: 85000, deductions: 12500, net: 72500 },
  { employee: "Sarah Johnson", department: "Marketing", store: "Downtown Branch", gross: 72000, deductions: 10800, net: 61200 },
  { employee: "Mike Chen", department: "Sales", store: "Main Store", gross: 68000, deductions: 9500, net: 58500 },
  { employee: "Emily Davis", department: "HR", store: "West Side", gross: 55000, deductions: 8200, net: 46800 },
  { employee: "Alex Wilson", department: "Finance", store: "Downtown Branch", gross: 62000, deductions: 9300, net: 52700 },
];

const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function PayrollReports() {
  const [filteredDepartment, setFilteredDepartment] = useState("all");
  const [filteredLocation, setFilteredLocation] = useState("all");
  const { data: locations = [] } = useAllLocations();

  const filteredDetails = payrollDetails.filter(d => {
    const deptMatch = filteredDepartment === "all" || d.department === filteredDepartment;
    const locationMatch = filteredLocation === "all" || locations.find(s => s.id === filteredLocation)?.name === d.store;
    return deptMatch && locationMatch;
  });

  const exportData = {
    headers: ["Employee", "Department", "Store", "Gross Salary", "Deductions", "Net Salary"],
    rows: filteredDetails.map(d => [
      d.employee,
      d.department,
      d.store,
      formatCurrency(d.gross),
      formatCurrency(d.deductions),
      formatCurrency(d.net),
    ]),
    filename: "payroll-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Payroll Reports"
        description="Comprehensive payroll analytics and salary disbursement reports"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <ReportFilters
          departments={departments}
          stores={locations.map(s => ({ id: s.id, name: s.name }))}
          onDepartmentChange={setFilteredDepartment}
          onStoreChange={setFilteredLocation}
          showStoreFilter={true}
        />
        <ReportExport data={exportData} title="Payroll Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Disbursement"
          value="₹9.5L"
          icon={Wallet}
          trend={{ value: 3.2, isPositive: true }}
          subtitle="This month"
        />
        <StatCard
          title="Avg. Salary"
          value="₹68,200"
          icon={TrendingUp}
          trend={{ value: 2.5, isPositive: true }}
          subtitle="Per employee"
        />
        <StatCard
          title="Total Deductions"
          value="₹1.85L"
          icon={Receipt}
          subtitle="This month"
        />
        <StatCard
          title="Net Payable"
          value="₹8.0L"
          icon={CreditCard}
          subtitle="After deductions"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AreaChartCard
          title="Monthly Salary Disbursement Trends"
          data={monthlyDisbursementData}
          areas={[
            { dataKey: "gross", name: "Gross Salary" },
            { dataKey: "net", name: "Net Salary" },
          ]}
        />
        <BarChartCard
          title="Payroll by Department"
          data={departmentPayrollData}
          horizontal
        />
        <PieChartCard title="Earnings Breakdown" data={earningsBreakdown} />
        <PieChartCard title="Deductions Breakdown" data={deductionsBreakdown} />
      </div>

      {/* Payroll Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Payroll Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{detail.employee}</TableCell>
                  <TableCell>{detail.department}</TableCell>
                  <TableCell>{detail.store}</TableCell>
                  <TableCell className="text-right">{formatCurrency(detail.gross)}</TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCurrency(detail.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatCurrency(detail.net)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
