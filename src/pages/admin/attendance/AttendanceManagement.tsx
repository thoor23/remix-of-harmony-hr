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
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAttendanceRecords, useTodayAttendanceStats } from "@/hooks/useAttendance";
import { useEmployees } from "@/hooks/useEmployees";
import { format } from "date-fns";

export default function AttendanceManagement() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  );

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendanceRecords(selectedMonth);
  const { data: todayStats } = useTodayAttendanceStats();

  const isLoading = employeesLoading || attendanceLoading;

  // Group attendance by employee for overview
  const employeeAttendance = employees.map((emp) => {
    const records = attendanceRecords.filter((r) => r.employee_id === emp.id);
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

  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = format(date, "MMMM yyyy");
      options.push({ value, label });
    }
    return options;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Management"
        description="Track and manage employee attendance"
      />

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
              <p className="text-2xl font-semibold">{todayStats?.present || 0}</p>
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
              <p className="text-2xl font-semibold">{todayStats?.late || 0}</p>
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
              <p className="text-2xl font-semibold">{todayStats?.absent || 0}</p>
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
              <p className="text-2xl font-semibold">{todayStats?.onLeave || 0}</p>
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
                {getMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
                  {employeeAttendance.length > 0 ? employeeAttendance.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.profile?.avatar_url || ""} />
                            <AvatarFallback>
                              {emp.profile?.first_name?.[0] || ""}
                              {emp.profile?.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {emp.profile?.first_name} {emp.profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.employee_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department?.name || "-"}</TableCell>
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
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
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
                  {attendanceRecords.slice(0, 20).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.employee?.profile?.avatar_url || ""} />
                            <AvatarFallback>
                              {record.employee?.profile?.first_name?.[0] || ""}
                              {record.employee?.profile?.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {record.employee?.profile?.first_name} {record.employee?.profile?.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{record.check_in || "-"}</TableCell>
                      <TableCell>{record.check_out || "-"}</TableCell>
                      <TableCell>{record.work_hours ? `${record.work_hours}h` : "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={record.status as StatusType} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No attendance records found
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
