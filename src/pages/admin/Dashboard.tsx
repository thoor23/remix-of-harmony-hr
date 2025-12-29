import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { LiveAttendanceFeed } from "@/components/dashboard/LiveAttendanceFeed";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { UpcomingEventsCard } from "@/components/dashboard/UpcomingEventsCard";
import { AreaChartCard } from "@/components/reports/charts/AreaChartCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import {
  Users,
  CalendarCheck,
  Clock,
  UserPlus,
  ArrowRight,
  Ticket,
  DollarSign,
} from "lucide-react";
import { 
  useAdminDashboardStats, 
  usePendingLeaveRequests, 
  useRecentAnnouncements,
  useAttendanceTrend,
  useLeaveBreakdown,
  usePayrollSummary,
} from "@/hooks/useDashboard";
import { useUpdateLeaveRequest } from "@/hooks/useLeaves";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminDashboardStats();
  const { data: pendingRequests = [], isLoading: loadingRequests } = usePendingLeaveRequests(5);
  const { data: announcements = [], isLoading: loadingAnnouncements } = useRecentAnnouncements();
  const { data: attendanceTrend = [], isLoading: loadingTrend } = useAttendanceTrend(7);
  const { data: leaveBreakdown = [], isLoading: loadingLeaveBreakdown } = useLeaveBreakdown();
  const { data: payrollSummary } = usePayrollSummary();
  const updateLeaveRequest = useUpdateLeaveRequest();

  const handleApprove = (id: string) => {
    updateLeaveRequest.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateLeaveRequest.mutate({ id, status: "rejected" });
  };

  // Transform department data for pie chart
  const departmentChartData = stats?.departmentWiseCount?.map(dept => ({
    name: dept.department,
    value: dept.count,
  })) || [];

  if (loadingStats) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Welcome back! Here's what's happening today." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening today."
      />

      {/* Announcement Banner */}
      <AnnouncementBanner announcements={announcements} isLoading={loadingAnnouncements} />

      {/* Stats Grid - 6 columns on xl */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
        <EnhancedStatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle={`${stats?.activeEmployees || 0} active`}
          icon={Users}
          variant="primary"
        />
        <EnhancedStatCard
          title="Present Today"
          value={`${stats?.attendancePercentage || 0}%`}
          subtitle={`${stats?.todayAttendance || 0} employees`}
          icon={Clock}
          variant="success"
        />
        <EnhancedStatCard
          title="Pending Leaves"
          value={stats?.pendingLeaveRequests || 0}
          subtitle="Awaiting approval"
          icon={CalendarCheck}
          variant={stats?.pendingLeaveRequests && stats.pendingLeaveRequests > 0 ? "warning" : "default"}
        />
        <EnhancedStatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          subtitle="Need attention"
          icon={Ticket}
          variant={stats?.openTickets && stats.openTickets > 0 ? "danger" : "default"}
        />
        <EnhancedStatCard
          title="New Joiners"
          value={stats?.newJoinersThisMonth || 0}
          subtitle="This month"
          icon={UserPlus}
        />
        <EnhancedStatCard
          title="Payroll"
          value={payrollSummary?.payslipsGenerated || 0}
          subtitle="Payslips generated"
          icon={DollarSign}
          trend={payrollSummary?.change ? { value: Math.abs(payrollSummary.change), isPositive: payrollSummary.change >= 0 } : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Attendance Trend Chart */}
        <AreaChartCard
          title="Attendance Trend (Last 7 Days)"
          data={attendanceTrend.map(item => ({
            name: item.name,
            present: item.present,
            late: item.late,
            absent: item.absent,
          }))}
          areas={[
            { dataKey: "present", name: "Present", color: "hsl(var(--success))" },
            { dataKey: "late", name: "Late", color: "hsl(var(--warning))" },
            { dataKey: "absent", name: "Absent", color: "hsl(var(--destructive))" },
          ]}
          className="dark:border-border/50"
        />
        
        {/* Department Distribution */}
        <PieChartCard
          title="Department Distribution"
          data={departmentChartData}
          className="dark:border-border/50"
        />
      </div>

      {/* Main Content Grid - 3 columns */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Pending Leave Requests - spans 2 columns */}
        <Card className="lg:col-span-2 dark:border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Pending Leave Requests</CardTitle>
              <CardDescription>Requests awaiting your approval</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/leaves">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => {
                  const profile = request.employee_profile;
                  const name = profile 
                    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() 
                    : "Unknown";
                  const initials = profile 
                    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}` 
                    : "??";

                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg border dark:border-border/50 bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.leave_type?.name || "Leave"} • {request.days} day{request.days > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.start_date), "MMM dd")} to {format(new Date(request.end_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={updateLeaveRequest.isPending}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={updateLeaveRequest.isPending}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {pendingRequests.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <QuickActionsGrid />
      </div>

      {/* Bottom Row - 3 columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Attendance Feed */}
        <LiveAttendanceFeed />

        {/* Activity Timeline */}
        <ActivityTimeline />

        {/* Upcoming Events */}
        <UpcomingEventsCard />
      </div>
    </PageContainer>
  );
}
