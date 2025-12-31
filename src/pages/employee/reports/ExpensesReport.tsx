import { useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { 
  Receipt, Clock, CheckCircle, XCircle
} from "lucide-react";
import { useMyExpenseClaims, useExpenseCategories } from "@/hooks/useExpenses";

export default function EmployeeExpensesReport() {
  const { data: expenses = [], isLoading } = useMyExpenseClaims();
  const { data: categories = [] } = useExpenseCategories();

  // Calculate stats
  const stats = useMemo(() => {
    const pending = expenses.filter(e => e.status === "pending").length;
    const approved = expenses.filter(e => e.status === "approved" || e.status === "reimbursed").length;
    const rejected = expenses.filter(e => e.status === "rejected").length;
    const totalClaimed = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const approvedAmount = expenses
      .filter(e => e.status === "approved" || e.status === "reimbursed")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { pending, approved, rejected, totalClaimed, approvedAmount };
  }, [expenses]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || "Other";
      breakdown[categoryName] = (breakdown[categoryName] || 0) + Number(expense.amount);
    });
    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  // Status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    expenses.forEach((expense) => {
      const status = expense.status.charAt(0).toUpperCase() + expense.status.slice(1);
      breakdown[status] = (breakdown[status] || 0) + 1;
    });
    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  // Monthly trend for bar chart
  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }

    expenses.forEach((expense) => {
      const date = new Date(expense.expense_date);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key] !== undefined) {
        months[key] += Number(expense.amount);
      }
    });

    return Object.entries(months).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Expense Report</h1>
        <p className="text-muted-foreground">View your expense claim statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Claims"
          value={expenses.length}
          icon={Receipt}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Monthly Spending"
          description="Your expense claims over the last 6 months"
          data={monthlyTrend}
          dataKey="amount"
          xAxisKey="name"
          height={300}
        />

        <PieChartCard
          title="Expenses by Category"
          description="Distribution of your expenses across categories"
          data={categoryBreakdown}
          dataKey="value"
          nameKey="name"
          height={300}
        />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Expense Summary</CardTitle>
            <CardDescription>Overview of your expense claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Claimed</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalClaimed)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Approved Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.approvedAmount)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {expenses.length > 0 
                    ? Math.round((stats.approved / expenses.length) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
