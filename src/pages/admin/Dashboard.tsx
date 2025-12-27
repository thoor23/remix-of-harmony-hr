import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  CalendarCheck,
  Clock,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Cake,
  Megaphone,
} from "lucide-react";
import { adminDashboardStats, employees, leaveRequests, announcements } from "@/data/mockData";

export default function AdminDashboard() {
  const pendingRequests = leaveRequests.filter((r) => r.status === "pending");

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Employees"
          value={adminDashboardStats.totalEmployees}
          subtitle={`${adminDashboardStats.activeEmployees} active`}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Pending Leave Requests"
          value={adminDashboardStats.pendingLeaveRequests}
          subtitle="Awaiting approval"
          icon={CalendarCheck}
        />
        <StatCard
          title="Today's Attendance"
          value={`${adminDashboardStats.attendancePercentage}%`}
          subtitle={`${adminDashboardStats.todayAttendance} employees present`}
          icon={Clock}
        />
        <StatCard
          title="New Joiners"
          value={adminDashboardStats.newJoinersThisMonth}
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
            <div className="space-y-4">
              {pendingRequests.slice(0, 4).map((request) => {
                const employee = employees.find((e) => e.id === request.employeeId);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={employee?.avatar} />
                        <AvatarFallback>
                          {request.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.leaveTypeName} • {request.days} day
                          {request.days > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.startDate} to {request.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                      <Button size="sm">Approve</Button>
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
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Birthdays */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cake className="h-5 w-5 text-primary" />
                Upcoming Birthdays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminDashboardStats.upcomingBirthdays.map((birthday) => {
                  const employee = employees.find(
                    (e) => e.id === birthday.employeeId
                  );
                  return (
                    <div
                      key={birthday.employeeId}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee?.avatar} />
                        <AvatarFallback>
                          {birthday.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {birthday.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {birthday.date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Announcements
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/announcements">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      {announcement.priority === "high" && (
                        <StatusBadge status="pending" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                {adminDashboardStats.departmentWiseCount
                  .slice(0, 5)
                  .map((dept) => (
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
                              width: `${(dept.count / adminDashboardStats.totalEmployees) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
