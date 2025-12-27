import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Timer } from "lucide-react";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { useMyAttendance } from "@/hooks/useAttendance";

export default function EmployeeAttendance() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );

  const { data: employee, isLoading: employeeLoading } = useCurrentEmployee();
  const { data: myRecords = [], isLoading: recordsLoading } = useMyAttendance(employee?.id);

  // Filter records for selected month
  const filteredRecords = myRecords.filter((r) => r.date.startsWith(selectedMonth));

  // Calculate stats
  const present = filteredRecords.filter((r) => r.status === "present").length;
  const late = filteredRecords.filter((r) => r.status === "late").length;
  const absent = filteredRecords.filter((r) => r.status === "absent").length;
  const leaves = filteredRecords.filter((r) => r.status === "on-leave").length;
  const totalHours = filteredRecords.reduce((sum, r) => sum + Number(r.work_hours || 0), 0);

  // Generate calendar days
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
      const record = filteredRecords.find((r) => r.date === date);
      days.push({ day, date, record });
    }
    return days;
  };

  const calendarDays = getDaysInMonth();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "present":
        return "bg-success text-success-foreground";
      case "late":
        return "bg-warning text-warning-foreground";
      case "absent":
        return "bg-destructive text-destructive-foreground";
      case "on-leave":
        return "bg-info text-info-foreground";
      case "weekend":
        return "bg-muted text-muted-foreground";
      case "holiday":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  };

  const isLoading = employeeLoading || recordsLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Attendance" description="View your attendance records and summary" />
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="My Attendance" description="View your attendance records and summary" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{leaves}</p>
              <p className="text-xs text-muted-foreground">On Leave</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-4 mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Attendance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-info" />
                  <span className="text-sm">On Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted" />
                  <span className="text-sm">No Record</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {/* Empty cells for first week */}
                {Array.from({ length: new Date(`${selectedMonth}-01`).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarDays.map(({ day, record }) => (
                  <div
                    key={day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm ${getStatusColor(record?.status)}`}
                  >
                    <span className="font-medium">{day}</span>
                    {record?.work_hours && (
                      <span className="text-xs opacity-75">{Number(record.work_hours).toFixed(1)}h</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.check_in || "-"}</TableCell>
                        <TableCell>{record.check_out || "-"}</TableCell>
                        <TableCell>
                          {record.work_hours ? `${Number(record.work_hours).toFixed(1)}h` : "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status as any} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No attendance records for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
