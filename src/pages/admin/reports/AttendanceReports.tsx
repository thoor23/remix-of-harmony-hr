import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportExport } from "@/components/reports/ReportExport";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { LineChartCard } from "@/components/reports/charts/LineChartCard";
import { AreaChartCard } from "@/components/reports/charts/AreaChartCard";
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
import { Users, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useStores } from "@/hooks/useStores";

const weeklyAttendanceData = [
  { name: "Mon", present: 115, late: 5, absent: 2 },
  { name: "Tue", present: 118, late: 3, absent: 1 },
  { name: "Wed", present: 112, late: 8, absent: 2 },
  { name: "Thu", present: 116, late: 4, absent: 2 },
  { name: "Fri", present: 110, late: 6, absent: 6 },
];

const monthlyTrendsData = [
  { name: "Jul", rate: 94 },
  { name: "Aug", rate: 96 },
  { name: "Sep", rate: 93 },
  { name: "Oct", rate: 95 },
  { name: "Nov", rate: 97 },
  { name: "Dec", rate: 92 },
];

const departmentAttendanceData = [
  { name: "Engineering", value: 97 },
  { name: "Sales", value: 94 },
  { name: "Marketing", value: 96 },
  { name: "HR", value: 98 },
  { name: "Finance", value: 95 },
];

const lateArrivalsData = [
  { name: "Mon", value: 5 },
  { name: "Tue", value: 3 },
  { name: "Wed", value: 8 },
  { name: "Thu", value: 4 },
  { name: "Fri", value: 6 },
];

const attendanceDetails = [
  { employee: "John Smith", department: "Engineering", store: "Main Store", present: 22, late: 1, absent: 0, rate: "100%" },
  { employee: "Sarah Johnson", department: "Marketing", store: "Downtown Branch", present: 20, late: 2, absent: 1, rate: "95%" },
  { employee: "Mike Chen", department: "Sales", store: "Main Store", present: 21, late: 0, absent: 2, rate: "91%" },
  { employee: "Emily Davis", department: "HR", store: "West Side", present: 23, late: 0, absent: 0, rate: "100%" },
  { employee: "Alex Wilson", department: "Finance", store: "Downtown Branch", present: 20, late: 3, absent: 0, rate: "100%" },
];

const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];

export default function AttendanceReports() {
  const [filteredDepartment, setFilteredDepartment] = useState("all");
  const [filteredStore, setFilteredStore] = useState("all");
  const { data: stores = [] } = useStores();

  const filteredDetails = attendanceDetails.filter(d => {
    const deptMatch = filteredDepartment === "all" || d.department === filteredDepartment;
    const storeMatch = filteredStore === "all" || stores.find(s => s.id === filteredStore)?.name === d.store;
    return deptMatch && storeMatch;
  });

  const exportData = {
    headers: ["Employee", "Department", "Store", "Present Days", "Late Days", "Absent Days", "Attendance Rate"],
    rows: filteredDetails.map(d => [
      d.employee,
      d.department,
      d.store,
      d.present,
      d.late,
      d.absent,
      d.rate,
    ]),
    filename: "attendance-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Reports"
        description="Track and analyze employee attendance patterns"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <ReportFilters
          departments={departments}
          stores={stores.map(s => ({ id: s.id, name: s.name }))}
          onDepartmentChange={setFilteredDepartment}
          onStoreChange={setFilteredStore}
          showStoreFilter={true}
        />
        <ReportExport data={exportData} title="Attendance Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Avg. Attendance Rate"
          value="95.2%"
          icon={Users}
          trend={{ value: 2.1, isPositive: true }}
        />
        <StatCard
          title="On-Time Rate"
          value="92.8%"
          icon={Clock}
          trend={{ value: 1.5, isPositive: true }}
        />
        <StatCard
          title="Late Arrivals (Avg/Day)"
          value="5.2"
          icon={AlertTriangle}
          trend={{ value: 0.8, isPositive: false }}
        />
        <StatCard
          title="Productivity Index"
          value="8.4/10"
          icon={TrendingUp}
          trend={{ value: 0.3, isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AreaChartCard
          title="Weekly Attendance Overview"
          data={weeklyAttendanceData}
          areas={[
            { dataKey: "present", name: "Present" },
            { dataKey: "late", name: "Late" },
            { dataKey: "absent", name: "Absent" },
          ]}
          stacked
        />
        <LineChartCard
          title="Monthly Attendance Rate Trends"
          data={monthlyTrendsData}
          lines={[{ dataKey: "rate", name: "Attendance Rate %" }]}
        />
        <BarChartCard
          title="Department-wise Attendance Rate"
          data={departmentAttendanceData}
          horizontal
        />
        <BarChartCard
          title="Late Arrivals by Day"
          data={lateArrivalsData}
        />
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Details by Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-center">Present Days</TableHead>
                <TableHead className="text-center">Late Days</TableHead>
                <TableHead className="text-center">Absent Days</TableHead>
                <TableHead className="text-right">Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{detail.employee}</TableCell>
                  <TableCell>{detail.department}</TableCell>
                  <TableCell>{detail.store}</TableCell>
                  <TableCell className="text-center">{detail.present}</TableCell>
                  <TableCell className="text-center">{detail.late}</TableCell>
                  <TableCell className="text-center">{detail.absent}</TableCell>
                  <TableCell className="text-right font-medium">{detail.rate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
