import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportExport } from "@/components/reports/ReportExport";
import { LineChartCard } from "@/components/reports/charts/LineChartCard";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { CalendarDays, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useMyAttendance } from "@/hooks/useAttendance";
import { format } from "date-fns";
import { useMemo } from "react";

// Helper to safely format date
const safeFormatDate = (dateStr: string | null | undefined, formatStr: string): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return format(date, formatStr);
  } catch {
    return "-";
  }
};

// Helper to format time string (HH:mm:ss)
const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "-";
  return timeStr.slice(0, 5); // Take HH:mm from HH:mm:ss
};

export default function EmployeeAttendanceReport() {
  const { data: attendanceRecords = [] } = useMyAttendance();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === "present").length;
    const late = attendanceRecords.filter(r => r.status === "late").length;
    const absent = attendanceRecords.filter(r => r.status === "absent").length;
    const onLeave = attendanceRecords.filter(r => r.status === "on_leave").length;
    const avgHours = total > 0 
      ? (attendanceRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0) / total).toFixed(1)
      : "0";
    const onTimeRate = total > 0 ? Math.round(((present) / total) * 100) : 0;

    return { total, present, late, absent, onLeave, avgHours, onTimeRate };
  }, [attendanceRecords]);

  // Monthly attendance trend
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<string, number>();
    attendanceRecords.forEach(record => {
      const dateStr = safeFormatDate(record.date, "MMM");
      if (dateStr !== "-") {
        monthMap.set(dateStr, (monthMap.get(dateStr) || 0) + 1);
      }
    });
    return Array.from(monthMap.entries()).slice(-6).map(([name, value]) => ({ name, value }));
  }, [attendanceRecords]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: "Present", value: stats.present, fill: "hsl(var(--chart-1))" },
    { name: "Late", value: stats.late, fill: "hsl(var(--chart-2))" },
    { name: "Absent", value: stats.absent, fill: "hsl(var(--chart-3))" },
    { name: "On Leave", value: stats.onLeave, fill: "hsl(var(--chart-4))" },
  ].filter(item => item.value > 0), [stats]);

  // Work hours by day of week
  const workHoursByDay = useMemo(() => {
    const dayMap = new Map<string, { hours: number; count: number }>();
    attendanceRecords.forEach(record => {
      const day = safeFormatDate(record.date, "EEE");
      if (day !== "-") {
        const current = dayMap.get(day) || { hours: 0, count: 0 };
        dayMap.set(day, { 
          hours: current.hours + (record.work_hours || 0), 
          count: current.count + 1 
        });
      }
    });
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map(day => {
        const data = dayMap.get(day);
        return { name: day, value: data ? Math.round(data.hours / data.count * 10) / 10 : 0 };
      })
      .filter(d => d.value > 0);
  }, [attendanceRecords]);

  // Recent records for table
  const recentRecords = attendanceRecords.slice(0, 10);

  const exportData = {
    headers: ["Date", "Check In", "Check Out", "Hours", "Status"],
    rows: attendanceRecords.map(r => [
      safeFormatDate(r.date, "dd MMM yyyy"),
      formatTime(r.check_in),
      formatTime(r.check_out),
      r.work_hours?.toFixed(1) || "-",
      r.status,
    ]),
    filename: "my-attendance-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Attendance Report"
        description="Track your attendance patterns and work hours"
      />
      <div className="flex justify-end mb-6">
        <ReportExport data={exportData} title="My Attendance Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Days"
          value={stats.total.toString()}
          icon={CalendarDays}
        />
        <StatCard
          title="Days Present"
          value={stats.present.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title="On-Time Rate"
          value={`${stats.onTimeRate}%`}
          icon={Clock}
        />
        <StatCard
          title="Avg. Work Hours"
          value={`${stats.avgHours} hrs`}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <LineChartCard
          title="Monthly Attendance Trend"
          data={monthlyTrendData}
          lines={[{ dataKey: "value", name: "Days Present" }]}
        />
        <PieChartCard
          title="Status Distribution"
          data={statusDistribution}
          showLegend
        />
        <BarChartCard
          title="Average Work Hours by Day"
          data={workHoursByDay}
        />
      </div>

      {/* Recent Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead className="text-center">Work Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                recentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{safeFormatDate(record.date, "dd MMM yyyy")}</TableCell>
                    <TableCell>{formatTime(record.check_in)}</TableCell>
                    <TableCell>{formatTime(record.check_out)}</TableCell>
                    <TableCell className="text-center">{record.work_hours?.toFixed(1) || "-"}</TableCell>
                    <TableCell className="capitalize">{record.status?.replace("_", " ") || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
