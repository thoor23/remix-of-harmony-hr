import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
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
import { Clock, ArrowLeftRight, CheckCircle, Calendar } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyShiftExchangeRequests } from "@/hooks/useShiftExchange";
import { format } from "date-fns";
import { useMemo } from "react";

export default function EmployeeShiftReport() {
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: shiftExchanges = [] } = useMyShiftExchangeRequests(currentEmployee?.id);

  // Filter to only user's requests
  const myExchanges = shiftExchanges.filter(
    e => e.requester_id === currentEmployee?.id || e.target_employee_id === currentEmployee?.id
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const total = myExchanges.length;
    const pending = myExchanges.filter(e => e.status === "pending").length;
    const approved = myExchanges.filter(e => e.status === "approved").length;
    const rejected = myExchanges.filter(e => e.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [myExchanges]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: "Pending", value: stats.pending, fill: "hsl(var(--chart-1))" },
    { name: "Approved", value: stats.approved, fill: "hsl(var(--chart-2))" },
    { name: "Rejected", value: stats.rejected, fill: "hsl(var(--chart-3))" },
  ].filter(item => item.value > 0), [stats]);

  // Monthly exchange requests
  const monthlyRequests = useMemo(() => {
    const monthMap = new Map<string, number>();
    myExchanges.forEach(exchange => {
      const month = format(new Date(exchange.created_at), "MMM");
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });
    return Array.from(monthMap.entries()).slice(-6).map(([name, value]) => ({ name, value }));
  }, [myExchanges]);

  const exportData = {
    headers: ["Request Date", "Status", "Reason"],
    rows: myExchanges.map(e => [
      format(new Date(e.request_date), "dd MMM yyyy"),
      e.status,
      e.reason || "-",
    ]),
    filename: "my-shift-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Shift Report"
        description="Track your shift schedule and exchange requests"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Shift Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Exchange Requests"
          value={stats.total.toString()}
          icon={ArrowLeftRight}
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending.toString()}
          icon={Clock}
        />
        <StatCard
          title="Approved Requests"
          value={stats.approved.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="This Month"
          value={monthlyRequests[monthlyRequests.length - 1]?.value.toString() || "0"}
          icon={Calendar}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard
          title="Request Status Distribution"
          data={statusDistribution}
          showLegend
        />
        <BarChartCard
          title="Monthly Exchange Requests"
          data={monthlyRequests}
        />
      </div>

      {/* Recent Exchanges Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Shift Exchanges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Responded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myExchanges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No shift exchange requests found
                  </TableCell>
                </TableRow>
              ) : (
                myExchanges.slice(0, 10).map((exchange) => (
                  <TableRow key={exchange.id}>
                    <TableCell>{format(new Date(exchange.request_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="capitalize">{exchange.status}</TableCell>
                    <TableCell>{exchange.reason || "-"}</TableCell>
                    <TableCell>
                      {exchange.responded_at 
                        ? format(new Date(exchange.responded_at), "dd MMM yyyy") 
                        : "-"}
                    </TableCell>
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
