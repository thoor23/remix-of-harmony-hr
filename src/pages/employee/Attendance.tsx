import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Timer } from "lucide-react";
import { attendanceRecords } from "@/data/mockData";

export default function EmployeeAttendance() {
  const [selectedMonth, setSelectedMonth] = useState("2024-12");

  // Filter records for current employee
  const myRecords = attendanceRecords.filter((r) => r.employeeId === "emp-3");
  
  // Calculate stats
  const workingDays = myRecords.filter((r) => r.status !== "weekend" && r.status !== "holiday");
  const present = workingDays.filter((r) => r.status === "present").length;
  const late = workingDays.filter((r) => r.status === "late").length;
  const absent = workingDays.filter((r) => r.status === "absent").length;
  const leaves = workingDays.filter((r) => r.status === "on-leave").length;
  const totalHours = myRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);

  // Generate calendar days
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${selectedMonth}-${day.toString().padStart(2, "0")}`;
      const record = myRecords.find((r) => r.date === date);
      days.push({ day, date, record });
    }
    return days;
  };

  const calendarDays = getDaysInMonth();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "present": return "bg-success text-success-foreground";
      case "late": return "bg-warning text-warning-foreground";
      case "absent": return "bg-destructive text-destructive-foreground";
      case "on-leave": return "bg-info text-info-foreground";
      case "weekend": return "bg-muted text-muted-foreground";
      case "holiday": return "bg-primary text-primary-foreground";
      default: return "bg-muted/50 text-muted-foreground";
    }
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "My Attendance" }]} />

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
              <p className="text-2xl font-semibold">{totalHours}h</p>
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
            <SelectItem value="2024-12">December 2024</SelectItem>
            <SelectItem value="2024-11">November 2024</SelectItem>
            <SelectItem value="2024-10">October 2024</SelectItem>
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
                  <span className="text-sm">Weekend</span>
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
                    {record?.workHours && (
                      <span className="text-xs opacity-75">{record.workHours}h</span>
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
                  {myRecords.slice(0, 15).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.checkIn || "-"}</TableCell>
                      <TableCell>{record.checkOut || "-"}</TableCell>
                      <TableCell>{record.workHours ? `${record.workHours}h` : "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
