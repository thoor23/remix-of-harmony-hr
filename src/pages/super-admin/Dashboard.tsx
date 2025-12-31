import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Building2, Users, UserCheck, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { SuperAdminQuickActions } from "@/components/super-admin/SuperAdminQuickActions";
import { PlatformActivityTimeline } from "@/components/super-admin/PlatformActivityTimeline";
import { CompanyGrowthChart } from "@/components/super-admin/CompanyGrowthChart";
import { EmployeeDistributionChart } from "@/components/super-admin/EmployeeDistributionChart";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export default function SuperAdminDashboard() {
  const { stats, statsLoading, companies, companiesLoading } = useSuperAdmin();

  const activeRate = stats?.totalCompanies
    ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Platform Dashboard"
        description="Overview of all companies and platform metrics"
      />

      {/* Stats Cards - Enhanced */}
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
              value={stats?.totalCompanies || 0}
              subtitle={`${stats?.activeCompanies || 0} active`}
              icon={Building2}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
            />
            <EnhancedStatCard
              title="Total Employees"
              value={(stats?.totalEmployees || 0).toLocaleString()}
              subtitle="Across all companies"
              icon={Users}
              variant="success"
              trend={{ value: 8, isPositive: true }}
            />
            <EnhancedStatCard
              title="Total Users"
              value={(stats?.totalUsers || 0).toLocaleString()}
              subtitle="Registered accounts"
              icon={UserCheck}
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

      {/* Quick Actions & Activity */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <SuperAdminQuickActions />
        <PlatformActivityTimeline />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <CompanyGrowthChart />
        {!companiesLoading && <EmployeeDistributionChart companies={companies} />}
        {companiesLoading && <Skeleton className="h-[320px]" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Companies by Plan */}
        <Card className="dark:border-border/50">
          <CardHeader>
            <CardTitle>Companies by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64" />
            ) : stats?.companiesByPlan?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.companiesByPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="plan"
                    label={({ plan, count }) => `${plan}: ${count}`}
                  >
                    {stats.companiesByPlan.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Companies */}
        <Card className="dark:border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Companies</CardTitle>
            <Link to="/super-admin/companies">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {companiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No companies yet
              </div>
            ) : (
              <div className="space-y-3">
                {companies.slice(0, 5).map((company) => (
                  <Link
                    key={company.id}
                    to={`/super-admin/companies/${company.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <Building2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(company.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
