import { useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { 
  Receipt, TrendingUp, Clock, CheckCircle, XCircle, DollarSign
} from "lucide-react";
import { useExpenseClaims, useExpenseCategories, useExpenseStats } from "@/hooks/useExpenses";

export default function ExpenseReports() {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenseClaims();
  const { data: categories = [] } = useExpenseCategories();
  const { data: stats, isLoading: statsLoading } = useExpenseStats();

  const isLoading = expensesLoading || statsLoading;

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
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Expense Reports</h1>
        <p className="text-muted-foreground">Analyze expense claims and spending patterns</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Claims"
          value={stats?.total || 0}
          icon={Receipt}
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          trend={{ value: stats?.pending || 0, isPositive: false }}
        />
        <StatCard
          title="Approved Amount"
          value={formatCurrency(stats?.approvedAmount || 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Reimbursed"
          value={stats?.reimbursed || 0}
          icon={DollarSign}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChartCard
          title="Monthly Expense Trend"
          data={monthlyTrend.map(d => ({ name: d.name, value: d.amount }))}
        />

        <PieChartCard
          title="Expenses by Category"
          description="Distribution of expenses across categories"
          data={categoryBreakdown}
        />

        <PieChartCard
          title="Claims by Status"
          description="Current status distribution of expense claims"
          data={statusBreakdown}
        />

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Categories with highest expense claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              {categoryBreakdown.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No expense data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
