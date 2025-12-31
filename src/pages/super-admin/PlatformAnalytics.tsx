import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Activity,
  Calendar,
  CreditCard,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { format, subDays } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

// Generate mock monthly data
const generateMonthlyData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({
      month: format(date, "MMM"),
      companies: Math.floor(Math.random() * 5) + 1,
      employees: Math.floor(Math.random() * 50) + 10,
    });
  }
  
  return data;
};

// Generate mock subscription data
const generateSubscriptionData = (stats: { companiesByPlan?: Array<{ plan: string; count: number }> } | undefined) => {
  if (stats?.companiesByPlan?.length) {
    return stats.companiesByPlan.map(item => ({
      name: item.plan || "free",
      value: item.count,
    }));
  }
  
  return [
    { name: "Basic", value: 5 },
    { name: "Pro", value: 3 },
    { name: "Enterprise", value: 2 },
  ];
};

export default function PlatformAnalytics() {
  const { stats, statsLoading, companies, companiesLoading } = useSuperAdmin();

  const monthlyData = generateMonthlyData();
  const subscriptionData = generateSubscriptionData(stats);

  // Calculate growth metrics
  const totalCompanies = stats?.totalCompanies || 0;
  const activeCompanies = stats?.activeCompanies || 0;
  const totalEmployees = stats?.totalEmployees || 0;
  const totalUsers = stats?.totalUsers || 0;
  const activeRate = totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0;

  // Get top companies by employees
  const topCompanies = [...companies]
    .filter(c => c.employee_count && c.employee_count > 0)
    .sort((a, b) => (b.employee_count || 0) - (a.employee_count || 0))
    .slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title="Platform Analytics"
        description="Detailed analytics and insights across the platform"
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <EnhancedStatCard
              title="Total Companies"
              value={totalCompanies}
              subtitle={`${activeCompanies} active`}
              icon={Building2}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
            />
            <EnhancedStatCard
              title="Total Employees"
              value={totalEmployees.toLocaleString()}
              subtitle="Across all companies"
              icon={Users}
              variant="success"
              trend={{ value: 8, isPositive: true }}
            />
            <EnhancedStatCard
              title="Total Users"
              value={totalUsers.toLocaleString()}
              subtitle="Registered accounts"
              icon={Activity}
              variant="warning"
              trend={{ value: 15, isPositive: true }}
            />
            <EnhancedStatCard
              title="Active Rate"
              value={`${activeRate}%`}
              subtitle="Companies active"
              icon={TrendingUp}
              variant={activeRate >= 80 ? "success" : activeRate >= 50 ? "warning" : "danger"}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Monthly Growth */}
        <Card className="dark:border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="companies"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorCompanies)"
                  name="New Companies"
                />
                <Area
                  type="monotone"
                  dataKey="employees"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorEmployees)"
                  name="New Employees"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card className="dark:border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {subscriptionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Companies by Employees */}
      <Card className="dark:border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Top Companies by Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <Skeleton className="h-[250px]" />
          ) : topCompanies.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No company data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCompanies.map(c => ({ 
                name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name, 
                employees: c.employee_count || 0 
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="employees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
