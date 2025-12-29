import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { UpcomingBirthdaysCard } from "@/components/dashboard/UpcomingBirthdaysCard";
import { AreaChartCard } from "@/components/reports/charts/AreaChartCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import {
  Users,
  CalendarCheck,
  Clock,
  CalendarX,
} from "lucide-react";
import { 
  useAdminDashboardStats, 
  useRecentAnnouncements,
  useAttendanceTrend,
} from "@/hooks/useDashboard";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminDashboardStats();
  const { data: announcements = [], isLoading: loadingAnnouncements } = useRecentAnnouncements();
  const { data: attendanceTrend = [] } = useAttendanceTrend(7);

  // Transform department data for pie chart
  const departmentChartData = stats?.departmentWiseCount?.map(dept => ({
    name: dept.department,
    value: dept.count,
  })) || [];

  if (loadingStats) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Welcome back! Here's what's happening today." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
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

      {/* Stats Grid - 4 columns */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
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
          title="On Leave"
          value={stats?.onLeaveToday || 0}
          subtitle="Today"
          icon={CalendarX}
        />
        <EnhancedStatCard
          title="Pending Leaves"
          value={stats?.pendingLeaveRequests || 0}
          subtitle="Awaiting approval"
          icon={CalendarCheck}
          variant={stats?.pendingLeaveRequests && stats.pendingLeaveRequests > 0 ? "warning" : "default"}
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

      {/* Bottom Row - 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Timeline */}
        <ActivityTimeline />

        {/* Upcoming Birthdays */}
        <UpcomingBirthdaysCard />
      </div>
    </PageContainer>
  );
}
