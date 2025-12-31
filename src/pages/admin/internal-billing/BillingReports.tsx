import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileText, DollarSign, Clock, TrendingUp, Building2 } from "lucide-react";
import { useInternalInvoices, useInvoiceStats } from "@/hooks/useInternalInvoices";
import { useLocations } from "@/hooks/useLocations";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function BillingReports() {
  const { data: invoices } = useInternalInvoices();
  const { data: stats } = useInvoiceStats();
  const { data: locations } = useLocations();

  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Monthly trend data (last 6 months)
  const monthlyData = (() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const monthInvoices = invoices?.filter((inv) => {
        const date = new Date(inv.invoice_date);
        return date >= start && date <= end;
      }) || [];

      const sent = monthInvoices.filter((i) => i.status === "sent").reduce((sum, i) => sum + Number(i.total_amount), 0);
      const paid = monthInvoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.total_amount), 0);

      return {
        month: format(month, "MMM"),
        sent,
        paid,
        total: sent + paid,
      };
    });
  })();

  // Status distribution
  const statusData = (() => {
    const statusCounts: Record<string, number> = {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    invoices?.forEach((inv) => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }));
  })();

  // Location-wise billing (top 5 by amount)
  const locationData = (() => {
    const locationTotals: Record<string, { name: string; billed: number; received: number }> = {};

    invoices?.forEach((inv) => {
      // From location (billing out)
      if (inv.from_location) {
        if (!locationTotals[inv.from_location.id]) {
          locationTotals[inv.from_location.id] = { name: inv.from_location.name, billed: 0, received: 0 };
        }
        locationTotals[inv.from_location.id].billed += Number(inv.total_amount);
      }

      // To location (receiving)
      if (inv.to_location) {
        if (!locationTotals[inv.to_location.id]) {
          locationTotals[inv.to_location.id] = { name: inv.to_location.name, billed: 0, received: 0 };
        }
        locationTotals[inv.to_location.id].received += Number(inv.total_amount);
      }
    });

    return Object.values(locationTotals)
      .sort((a, b) => (b.billed + b.received) - (a.billed + a.received))
      .slice(0, 5);
  })();

  // Invoice type distribution
  const typeData = (() => {
    const typeCounts: Record<string, number> = {};
    const typeLabels: Record<string, string> = {
      expense_reimbursement: "Expense",
      internal_service: "Service",
      goods_transfer: "Goods",
    };

    invoices?.forEach((inv) => {
      const label = typeLabels[inv.invoice_type] || inv.invoice_type;
      typeCounts[label] = (typeCounts[label] || 0) + Number(inv.total_amount);
    });

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  })();

  // Calculate totals
  const totalBilled = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const totalPaid = invoices?.filter((i) => i.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const totalPending = invoices?.filter((i) => i.status === "sent").reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

  return (
    <PageContainer>
      <PageHeader title="Billing Reports" description="Analytics and insights for internal billing" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Billed"
          value={`₹${totalBilled.toLocaleString("en-IN")}`}
          icon={FileText}
        />
        <StatCard
          title="Total Received"
          value={`₹${totalPaid.toLocaleString("en-IN")}`}
          icon={DollarSign}
        />
        <StatCard
          title="Pending Amount"
          value={`₹${totalPending.toLocaleString("en-IN")}`}
          icon={Clock}
        />
        <StatCard
          title="Total Invoices"
          value={invoices?.length || 0}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Billing Trend</CardTitle>
            <CardDescription>Invoice amounts over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sent" name="Sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Paid" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>By Invoice Type</CardTitle>
            <CardDescription>Amount distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Location-wise Billing */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Locations by Billing</CardTitle>
            <CardDescription>Billing and receiving amounts by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number"
                    className="text-xs"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="billed" name="Billed Out" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="received" name="Received" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
