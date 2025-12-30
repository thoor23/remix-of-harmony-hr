import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnnouncementBanner } from "@/components/announcements/AnnouncementBanner";
import { 
  CalendarCheck, 
  Clock, 
  FileText, 
  Calendar, 
  ArrowRight, 
  CalendarPlus, 
  Wallet, 
  HelpCircle,
  Timer,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentEmployee, useLeaveBalances, useLeaveTypes } from "@/hooks/useCurrentEmployee";
import { useMyAttendance } from "@/hooks/useAttendance";
import { useHolidays } from "@/hooks/useHolidays";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { usePendingLeaveCount } from "@/hooks/usePendingLeaveCount";
import { useMyShiftAssignment, useShifts } from "@/hooks/useShifts";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInMinutes } from "date-fns";

export default function EmployeeDashboard() {
  const { data: employee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: leaveBalances = [] } = useLeaveBalances(employee?.id || "");
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: holidays = [] } = useHolidays(new Date().getFullYear());
  const { data: announcements = [] } = useAnnouncements();
  const { data: pendingLeaveCount = 0 } = usePendingLeaveCount(employee?.id || "");
  const { data: shiftAssignments = [] } = useMyShiftAssignment(employee?.id || "");
  const { data: shifts = [] } = useShifts();
  
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const { data: attendanceRecords = [] } = useMyAttendance(currentMonth);

  // Calculate stats
  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const lateCount = attendanceRecords.filter(r => r.status === "late").length;
  const totalLeaveBalance = leaveBalances.reduce((sum, b) => sum + (b.total_days - b.used_days - b.pending_days), 0);

  // Calculate work hours this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const weeklyRecords = attendanceRecords.filter(r => {
    const recordDate = parseISO(r.date);
    return isWithinInterval(recordDate, { start: weekStart, end: weekEnd });
  });
  
  const totalWeeklyMinutes = weeklyRecords.reduce((sum, r) => {
    if (r.check_in && r.check_out) {
      const checkIn = new Date(`${r.date}T${r.check_in}`);
      const checkOut = new Date(`${r.date}T${r.check_out}`);
      return sum + differenceInMinutes(checkOut, checkIn);
    }
    return sum + (r.work_hours || 0) * 60;
  }, 0);
  
  const weeklyHours = Math.round(totalWeeklyMinutes / 60);
  const targetWeeklyHours = 40;
  const weeklyProgress = Math.min((weeklyHours / targetWeeklyHours) * 100, 100);

  // Get current shift assignment - ensure it's an array
  const shiftList = Array.isArray(shiftAssignments) ? shiftAssignments : (shiftAssignments ? [shiftAssignments] : []);
  const currentShiftAssignment = shiftList.find(a => a.is_active);
  const currentShift = shifts.find(s => s.id === currentShiftAssignment?.shift_id);

  // Get upcoming holidays
  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .slice(0, 4);

  // Get active announcements
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

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/app/my-leaves">
            <CalendarPlus className="h-5 w-5 text-primary" />
            <span className="text-sm">Apply Leave</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/app/my-payslips">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm">View Payslip</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/app/my-helpdesk">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="text-sm">Raise Ticket</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link to="/app/my-attendance">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <span className="text-sm">My Attendance</span>
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Days Present" value={presentCount} subtitle="This month" icon={CalendarCheck} />
        <StatCard title="Days Late" value={lateCount} subtitle="This month" icon={Clock} />
        <StatCard title="Leave Balance" value={totalLeaveBalance} subtitle="Days available" icon={Calendar} />
        <StatCard title="Pending Requests" value={pendingLeaveCount} subtitle="Awaiting approval" icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Leave Balance & Shift Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Shift Card */}
          {currentShift && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  My Current Shift
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${currentShift.color || '#3B82F6'}20` }}
                    >
                      <Clock className="h-6 w-6" style={{ color: currentShift.color || '#3B82F6' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{currentShift.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentShift.start_time} - {currentShift.end_time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" style={{ borderColor: currentShift.color || '#3B82F6', color: currentShift.color || '#3B82F6' }}>
                    {currentShift.code}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Hours Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Work Hours This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{weeklyHours}h / {targetWeeklyHours}h</span>
                </div>
                <Progress value={weeklyProgress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {weeklyProgress >= 100 
                    ? "You've completed your weekly target!" 
                    : `${targetWeeklyHours - weeklyHours} hours remaining this week`
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leave Balance</CardTitle>
              <Button asChild size="sm">
                <Link to="/app/my-leaves">Apply Leave</Link>
              </Button>
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
        </div>

        {/* Right Column - Holidays & Quick Links */}
        <div className="space-y-6">
          {/* Upcoming Holidays */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingHolidays.length > 0 ? upcomingHolidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-muted/50">
                  <span className="font-medium">{h.name}</span>
                  <Badge variant="outline">{format(new Date(h.date), "MMM dd")}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming holidays</p>
              )}
              <Button asChild variant="ghost" className="w-full mt-2" size="sm">
                <Link to="/app/my-holidays">
                  View All Holidays
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="text-sm">
                    <p className="font-medium">{format(parseISO(record.date), "EEE, MMM dd")}</p>
                    <p className="text-muted-foreground text-xs">
                      {record.check_in || "--:--"} - {record.check_out || "--:--"}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      record.status === "present" 
                        ? "bg-success/10 text-success border-success/20" 
                        : record.status === "late"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
              {attendanceRecords.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No attendance records</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
