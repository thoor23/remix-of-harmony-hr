import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportCard } from "@/components/reports/ReportCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportActivity, useReportStats } from "@/hooks/useReportActivity";
import { format } from "date-fns";
import {
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  FileText,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";

export default function ReportsOverview() {
  const { data: recentActivity, isLoading: activityLoading } = useReportActivity();
  const { data: stats, isLoading: statsLoading } = useReportStats();

  return (
    <PageContainer>
      <PageHeader title="Reports" description="Generate and download reports for your organization" />
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.reportsGenerated || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Reports Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.scheduledReports || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Scheduled Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalDownloads || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.monthlyGrowth || '0'}</p>
                )}
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <h2 className="text-lg font-semibold mb-4">Report Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ReportCard
          title="Employee Reports"
          description="Headcount, demographics, and workforce analytics"
          icon={<Users className="h-5 w-5" />}
          href="/admin/reports/employee"
          badge="5 Reports"
        />
        <ReportCard
          title="Attendance Reports"
          description="Attendance trends, punctuality, and absenteeism"
          icon={<CalendarCheck className="h-5 w-5" />}
          href="/admin/reports/attendance"
          badge="4 Reports"
        />
        <ReportCard
          title="Leave Reports"
          description="Leave utilization, balances, and patterns"
          icon={<CalendarDays className="h-5 w-5" />}
          href="/admin/reports/leave"
          badge="4 Reports"
        />
        <ReportCard
          title="Payroll Reports"
          description="Salary analysis, disbursements, and deductions"
          icon={<Wallet className="h-5 w-5" />}
          href="/admin/reports/payroll"
          badge="4 Reports"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Export Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.performer_name || 'System'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{activity.action}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent export activity</p>
              <p className="text-sm">Export reports to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
