import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { LineChartCard } from "@/components/reports/charts/LineChartCard";
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
import { CalendarCheck, Clock, CheckCircle, PieChart } from "lucide-react";
import { useCurrentEmployee, useLeaveBalances } from "@/hooks/useCurrentEmployee";
import { useMyLeaveRequests, useLeaveTypes } from "@/hooks/useLeaves";
import { format } from "date-fns";
import { useMemo } from "react";

export default function EmployeeLeaveReport() {
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: leaveRequests = [] } = useMyLeaveRequests(currentEmployee?.id);
  const { data: leaveBalances = [] } = useLeaveBalances(currentEmployee?.id || "");
  const { data: leaveTypes = [] } = useLeaveTypes();

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTaken = leaveRequests.filter(r => r.status === "approved").reduce((sum, r) => sum + r.days, 0);
    const totalBalance = leaveBalances.reduce((sum, b) => sum + (b.total_days - b.used_days), 0);
    const pending = leaveRequests.filter(r => r.status === "pending").length;
    const approvedThisYear = leaveRequests.filter(r => 
      r.status === "approved" && 
      new Date(r.start_date).getFullYear() === new Date().getFullYear()
    ).length;

    return { totalTaken, totalBalance, pending, approvedThisYear };
  }, [leaveRequests, leaveBalances]);

  // Leave by type for pie chart
  const leaveByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    leaveRequests.filter(r => r.status === "approved").forEach(request => {
      const typeName = leaveTypes.find(t => t.id === request.leave_type_id)?.name || "Other";
      typeMap.set(typeName, (typeMap.get(typeName) || 0) + request.days);
    });
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return Array.from(typeMap.entries()).map(([name, value], i) => ({ 
      name, 
      value, 
      fill: colors[i % colors.length] 
    }));
  }, [leaveRequests, leaveTypes]);

  // Monthly leave trend
  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    leaveRequests.filter(r => r.status === "approved").forEach(request => {
      const month = format(new Date(request.start_date), "MMM");
      monthMap.set(month, (monthMap.get(month) || 0) + request.days);
    });
    return Array.from(monthMap.entries()).slice(-6).map(([name, value]) => ({ name, value }));
  }, [leaveRequests]);

  // Leave balance status
  const balanceStatus = useMemo(() => {
    return leaveBalances.map((balance, i) => {
      const typeName = leaveTypes.find(t => t.id === balance.leave_type_id)?.name || "Unknown";
      const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
      return {
        name: typeName,
        used: balance.used_days,
        available: balance.total_days - balance.used_days,
        fill: colors[i % colors.length],
      };
    });
  }, [leaveBalances, leaveTypes]);

  const exportData = {
    headers: ["Start Date", "End Date", "Type", "Days", "Status", "Reason"],
    rows: leaveRequests.map(r => [
      format(new Date(r.start_date), "dd MMM yyyy"),
      format(new Date(r.end_date), "dd MMM yyyy"),
      leaveTypes.find(t => t.id === r.leave_type_id)?.name || "-",
      r.days,
      r.status,
      r.reason || "-",
    ]),
    filename: "my-leave-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Leave Report"
        description="Track your leave history and balances"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Leave Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Leave Taken"
          value={`${stats.totalTaken} days`}
          icon={CalendarCheck}
        />
        <StatCard
          title="Leave Balance"
          value={`${stats.totalBalance} days`}
          icon={PieChart}
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending.toString()}
          icon={Clock}
        />
        <StatCard
          title="Approved This Year"
          value={stats.approvedThisYear.toString()}
          icon={CheckCircle}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard
          title="Leave by Type"
          data={leaveByType}
          showLegend
        />
        <LineChartCard
          title="Monthly Leave Trend"
          data={monthlyTrend}
          lines={[{ dataKey: "value", name: "Days" }]}
        />
      </div>

      {/* Leave Balance Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Leave Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Used</TableHead>
                <TableHead className="text-center">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveBalances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No leave balances found
                  </TableCell>
                </TableRow>
              ) : (
                leaveBalances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell>{leaveTypes.find(t => t.id === balance.leave_type_id)?.name || "Unknown"}</TableCell>
                    <TableCell className="text-center">{balance.total_days}</TableCell>
                    <TableCell className="text-center">{balance.used_days}</TableCell>
                    <TableCell className="text-center font-medium">{balance.total_days - balance.used_days}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.slice(0, 10).map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{format(new Date(request.start_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(new Date(request.end_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{leaveTypes.find(t => t.id === request.leave_type_id)?.name || "-"}</TableCell>
                    <TableCell className="text-center">{request.days}</TableCell>
                    <TableCell className="capitalize">{request.status}</TableCell>
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
