import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, Wallet, FileText, Calendar, Megaphone } from "lucide-react";
import { employeeDashboardStats, leaveTypes, announcements, holidays } from "@/data/mockData";
import { Link } from "react-router-dom";

export default function EmployeeDashboard() {
  return (
    <PageContainer>
      <PageHeader title="My Dashboard" description="Welcome back, Michael!" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Days Present" value={employeeDashboardStats.attendanceSummary.present} subtitle="This month" icon={CalendarCheck} />
        <StatCard title="Days Late" value={employeeDashboardStats.attendanceSummary.late} subtitle="This month" icon={Clock} />
        <StatCard title="Leave Balance" value={employeeDashboardStats.leaveBalance.reduce((sum, l) => sum + l.available, 0)} subtitle="Days available" icon={Calendar} />
        <StatCard title="Pending Requests" value={employeeDashboardStats.pendingRequests} subtitle="Awaiting approval" icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leave Balance</CardTitle>
            <Button asChild><Link to="/employee/leaves">Apply Leave</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {employeeDashboardStats.leaveBalance.map((balance) => {
                const type = leaveTypes.find((t) => t.id === balance.leaveTypeId);
                return (
                  <div key={balance.leaveTypeId} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: type?.color }} />
                      <span className="font-medium">{type?.name}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-semibold">{balance.available}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Used: {balance.used} / {balance.total}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Upcoming Holidays</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {holidays.slice(0, 4).map((h) => (
                <div key={h.id} className="flex justify-between text-sm">
                  <span>{h.name}</span>
                  <span className="text-muted-foreground">{h.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Announcements</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {announcements.slice(0, 2).map((a) => (
                <div key={a.id}>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
