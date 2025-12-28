import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { CalendarCheck, Clock, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentEmployee, useLeaveBalances, useLeaveTypes } from "@/hooks/useCurrentEmployee";
import { useMyAttendance } from "@/hooks/useAttendance";
import { useHolidays } from "@/hooks/useHolidays";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { usePendingLeaveCount } from "@/hooks/usePendingLeaveCount";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const { data: employee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: leaveBalances = [] } = useLeaveBalances(employee?.id || "");
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: holidays = [] } = useHolidays(new Date().getFullYear());
  const { data: announcements = [] } = useAnnouncements();
  const { data: pendingLeaveCount = 0 } = usePendingLeaveCount(employee?.id || "");
  
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const { data: attendanceRecords = [] } = useMyAttendance(employee?.id || "", currentMonth);

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const lateCount = attendanceRecords.filter(r => r.status === "late").length;
  const totalLeaveBalance = leaveBalances.reduce((sum, b) => sum + (b.total_days - b.used_days - b.pending_days), 0);

  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .slice(0, 4);

  const activeAnnouncements = announcements
    .filter(a => a.is_active)
    .slice(0, 2);

  if (employeeLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </PageContainer>
    );
  }

  const firstName = employee?.profile?.first_name || "User";

  return (
    <PageContainer>
      <PageHeader title="My Dashboard" description={`Welcome back, ${firstName}!`} />

      {/* Announcement Banner */}
      <AnnouncementBanner announcements={activeAnnouncements} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Days Present" value={presentCount} subtitle="This month" icon={CalendarCheck} />
        <StatCard title="Days Late" value={lateCount} subtitle="This month" icon={Clock} />
        <StatCard title="Leave Balance" value={totalLeaveBalance} subtitle="Days available" icon={Calendar} />
        <StatCard title="Pending Requests" value={pendingLeaveCount} subtitle="Awaiting approval" icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leave Balance</CardTitle>
            <Button asChild><Link to="/employee/leaves">Apply Leave</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {leaveBalances.length > 0 ? leaveBalances.map((balance) => {
                const type = leaveTypes.find((t) => t.id === balance.leave_type_id);
                const available = balance.total_days - balance.used_days - balance.pending_days;
                return (
                  <div key={balance.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: type?.color || "#3B82F6" }} />
                      <span className="font-medium">{type?.name || "Leave"}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-semibold">{available}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Used: {balance.used_days} / {balance.total_days}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-muted-foreground col-span-2">No leave balances configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Upcoming Holidays</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcomingHolidays.length > 0 ? upcomingHolidays.map((h) => (
                <div key={h.id} className="flex justify-between text-sm">
                  <span>{h.name}</span>
                  <span className="text-muted-foreground">{format(new Date(h.date), "MMM dd")}</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No upcoming holidays</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </PageContainer>
  );
}
