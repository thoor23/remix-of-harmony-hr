import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import {
  Users,
  CalendarCheck,
  Clock,
  UserPlus,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useAdminDashboardStats, usePendingLeaveRequests, useRecentAnnouncements } from "@/hooks/useDashboard";
import { useUpdateLeaveRequest } from "@/hooks/useLeaves";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminDashboardStats();
  const { data: pendingRequests = [], isLoading: loadingRequests } = usePendingLeaveRequests();
  const { data: announcements = [], isLoading: loadingAnnouncements } = useRecentAnnouncements();
  const updateLeaveRequest = useUpdateLeaveRequest();

  const handleApprove = (id: string) => {
    updateLeaveRequest.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateLeaveRequest.mutate({ id, status: "rejected" });
  };

  if (loadingStats) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Welcome back! Here's what's happening today." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle={`${stats?.activeEmployees || 0} active`}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Pending Leave Requests"
          value={stats?.pendingLeaveRequests || 0}
          subtitle="Awaiting approval"
          icon={CalendarCheck}
        />
        <StatCard
          title="Today's Attendance"
          value={`${stats?.attendancePercentage || 0}%`}
          subtitle={`${stats?.todayAttendance || 0} employees present`}
          icon={Clock}
        />
        <StatCard
          title="New Joiners"
          value={stats?.newJoinersThisMonth || 0}
          subtitle="This month"
          icon={UserPlus}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Leave Requests */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
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
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
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
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
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
                  <p className="text-center text-muted-foreground py-8">
                    No pending requests
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Department Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.departmentWiseCount?.slice(0, 5).map((dept) => (
                  <div key={dept.department} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{dept.department}</span>
                        <span className="text-sm text-muted-foreground">
                          {dept.count}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${stats?.totalEmployees ? (dept.count / stats.totalEmployees) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(!stats?.departmentWiseCount || stats.departmentWiseCount.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No department data
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
