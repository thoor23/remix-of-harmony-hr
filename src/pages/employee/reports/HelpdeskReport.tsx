import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { LineChartCard } from "@/components/reports/charts/LineChartCard";
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
import { Ticket, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyTickets } from "@/hooks/useHelpdesk";
import { format } from "date-fns";
import { useMemo } from "react";

export default function EmployeeHelpdeskReport() {
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: tickets = [] } = useMyTickets();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
    const resolved = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
    const highPriority = tickets.filter(t => t.priority === "high" || t.priority === "urgent").length;

    return { total, open, resolved, highPriority };
  }, [tickets]);

  // Tickets by status
  const ticketsByStatus = useMemo(() => {
    const statusMap = new Map<string, number>();
    tickets.forEach(ticket => {
      statusMap.set(ticket.status, (statusMap.get(ticket.status) || 0) + 1);
    });
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
    return Array.from(statusMap.entries()).map(([name, value], i) => ({ 
      name: name.replace("_", " "), 
      value, 
      fill: colors[i % colors.length] 
    }));
  }, [tickets]);

  // Tickets by category
  const ticketsByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    tickets.forEach(ticket => {
      categoryMap.set(ticket.category, (categoryMap.get(ticket.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // Monthly ticket trend
  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    tickets.forEach(ticket => {
      const month = format(new Date(ticket.created_at), "MMM");
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });
    return Array.from(monthMap.entries()).slice(-6).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const exportData = {
    headers: ["Subject", "Category", "Priority", "Status", "Created", "Resolved"],
    rows: tickets.map(t => [
      t.subject,
      t.category,
      t.priority,
      t.status,
      format(new Date(t.created_at), "dd MMM yyyy"),
      t.resolved_at ? format(new Date(t.resolved_at), "dd MMM yyyy") : "-",
    ]),
    filename: "my-helpdesk-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Helpdesk Report"
        description="Track your support tickets and resolutions"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Helpdesk Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Tickets"
          value={stats.total.toString()}
          icon={Ticket}
        />
        <StatCard
          title="Open Tickets"
          value={stats.open.toString()}
          icon={Clock}
        />
        <StatCard
          title="Resolved"
          value={stats.resolved.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority.toString()}
          icon={AlertCircle}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard
          title="Tickets by Status"
          data={ticketsByStatus}
          showLegend
        />
        <BarChartCard
          title="Tickets by Category"
          data={ticketsByCategory}
        />
        <LineChartCard
          title="Monthly Ticket Trend"
          data={monthlyTrend}
          lines={[{ dataKey: "value", name: "Tickets" }]}
          className="md:col-span-2"
        />
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Resolved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.slice(0, 10).map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell className="capitalize">{ticket.category}</TableCell>
                    <TableCell className="capitalize">{ticket.priority}</TableCell>
                    <TableCell className="capitalize">{ticket.status.replace("_", " ")}</TableCell>
                    <TableCell>{format(new Date(ticket.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      {ticket.resolved_at ? format(new Date(ticket.resolved_at), "dd MMM yyyy") : "-"}
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
