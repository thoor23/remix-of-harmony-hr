import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardSkeleton } from "@/components/shared/LoadingSkeletons";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { FileText, DollarSign, Clock, TrendingUp } from "lucide-react";
import { useInternalInvoices, useInvoiceStats } from "@/hooks/useInternalInvoices";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

export default function BillingReports() {
  const { data: invoices, isLoading } = useInternalInvoices();
  const { data: stats } = useInvoiceStats();

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
        name: format(month, "MMM"),
        value: sent + paid,
        sent,
        paid,
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
    const locationTotals: Record<string, { name: string; value: number; billed: number; received: number }> = {};

    invoices?.forEach((inv) => {
      // From location (billing out)
      if (inv.from_location) {
        if (!locationTotals[inv.from_location.id]) {
          locationTotals[inv.from_location.id] = { name: inv.from_location.name, value: 0, billed: 0, received: 0 };
        }
        locationTotals[inv.from_location.id].billed += Number(inv.total_amount);
        locationTotals[inv.from_location.id].value += Number(inv.total_amount);
      }

      // To location (receiving)
      if (inv.to_location) {
        if (!locationTotals[inv.to_location.id]) {
          locationTotals[inv.to_location.id] = { name: inv.to_location.name, value: 0, billed: 0, received: 0 };
        }
        locationTotals[inv.to_location.id].received += Number(inv.total_amount);
        locationTotals[inv.to_location.id].value += Number(inv.total_amount);
      }
    });

    return Object.values(locationTotals)
      .sort((a, b) => b.value - a.value)
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

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Billing Reports" description="Analytics and insights for internal billing" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2 h-[350px]">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading chart...</div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

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
        <BarChartCard
          title="Monthly Billing Trend"
          data={monthlyData}
          dataKey="sent"
          secondaryDataKey="paid"
          className="lg:col-span-2"
        />

        {/* Status Distribution */}
        <PieChartCard
          title="Invoice Status"
          description="Distribution by status"
          data={statusData}
        />

        {/* Invoice Type Distribution */}
        <PieChartCard
          title="By Invoice Type"
          description="Amount distribution by type"
          data={typeData}
        />

        {/* Location-wise Billing */}
        <BarChartCard
          title="Top Locations by Billing"
          data={locationData}
          dataKey="billed"
          secondaryDataKey="received"
          className="lg:col-span-2"
          horizontal
        />
      </div>
    </PageContainer>
  );
}
