import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { attendanceRecords, employees } from "@/data/mockData";

export default function AttendanceManagement() {
  const [selectedMonth, setSelectedMonth] = useState("2024-12");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Calculate today's attendance stats
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === today);
  const presentCount = todayRecords.filter((r) => r.status === "present").length;
  const absentCount = todayRecords.filter((r) => r.status === "absent").length;
  const lateCount = todayRecords.filter((r) => r.status === "late").length;
  const onLeaveCount = todayRecords.filter((r) => r.status === "on-leave").length;

  // Group attendance by employee for overview
  const employeeAttendance = employees.map((emp) => {
    const records = attendanceRecords.filter((r) => r.employeeId === emp.id);
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const leaves = records.filter((r) => r.status === "on-leave").length;
    const totalWorkDays = records.filter(
      (r) => r.status !== "weekend" && r.status !== "holiday"
    ).length;

    return {
      ...emp,
      present,
      absent,
      late,
      leaves,
      totalWorkDays,
      attendanceRate: totalWorkDays > 0 ? ((present + late) / totalWorkDays) * 100 : 0,
    };
  });

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Management"
        description="Track and manage employee attendance"
      >
        <Link to="/admin/attendance/regularization">
          <Button variant="outline">Regularization Requests</Button>
        </Link>
      </PageHeader>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{presentCount}</p>
              <p className="text-sm text-muted-foreground">Present Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{lateCount}</p>
              <p className="text-sm text-muted-foreground">Late Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{absentCount}</p>
              <p className="text-sm text-muted-foreground">Absent Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{onLeaveCount}</p>
              <p className="text-sm text-muted-foreground">On Leave</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="daily">Daily Log</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-12">December 2024</SelectItem>
                <SelectItem value="2024-11">November 2024</SelectItem>
                <SelectItem value="2024-10">October 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Employee Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Leaves</TableHead>
                    <TableHead className="text-center">Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeAttendance.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatar} />
                            <AvatarFallback>
                              {emp.firstName[0]}
                              {emp.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.employeeId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-success font-medium">{emp.present}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-warning font-medium">{emp.late}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-destructive font-medium">{emp.absent}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-info font-medium">{emp.leaves}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${emp.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {emp.attendanceRate.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.slice(0, 20).map((record) => {
                    const emp = employees.find((e) => e.id === record.employeeId);
                    if (!emp) return null;
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={emp.avatar} />
                              <AvatarFallback>
                                {emp.firstName[0]}
                                {emp.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {emp.firstName} {emp.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.checkIn || "-"}</TableCell>
                        <TableCell>{record.checkOut || "-"}</TableCell>
                        <TableCell>{record.workHours ? `${record.workHours}h` : "-"}</TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
