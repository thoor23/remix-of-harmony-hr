import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportExport } from "@/components/reports/ReportExport";
import { PieChartCard } from "@/components/reports/charts/PieChartCard";
import { BarChartCard } from "@/components/reports/charts/BarChartCard";
import { LineChartCard } from "@/components/reports/charts/LineChartCard";
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
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, TrendingDown, Clock } from "lucide-react";
import { useAllLocations } from "@/hooks/useLocations";

const leaveByTypeData = [
  { name: "Casual Leave", value: 145 },
  { name: "Sick Leave", value: 78 },
  { name: "Annual Leave", value: 234 },
  { name: "Personal Leave", value: 45 },
  { name: "Other", value: 23 },
];

const monthlyLeaveTrends = [
  { name: "Jul", days: 42 },
  { name: "Aug", days: 38 },
  { name: "Sep", days: 55 },
  { name: "Oct", days: 48 },
  { name: "Nov", days: 35 },
  { name: "Dec", days: 65 },
];

const departmentLeaveData = [
  { name: "Engineering", value: 156 },
  { name: "Sales", value: 98 },
  { name: "Marketing", value: 67 },
  { name: "HR", value: 45 },
  { name: "Finance", value: 52 },
];

const leaveBalanceSummary = [
  { name: "Used", value: 525 },
  { name: "Available", value: 1875 },
];

const topLeaveRecords = [
  { employee: "John Smith", department: "Engineering", store: "Main Store", type: "Annual Leave", days: 12, status: "Completed" },
  { employee: "Sarah Johnson", department: "Marketing", store: "Downtown Branch", type: "Sick Leave", days: 8, status: "Completed" },
  { employee: "Mike Chen", department: "Sales", store: "Main Store", type: "Casual Leave", days: 5, status: "Approved" },
  { employee: "Emily Davis", department: "HR", store: "West Side", type: "Personal Leave", days: 3, status: "Pending" },
  { employee: "Alex Wilson", department: "Finance", store: "Downtown Branch", type: "Annual Leave", days: 10, status: "Completed" },
];

const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];

export default function LeaveReports() {
  const [filteredDepartment, setFilteredDepartment] = useState("all");
  const [filteredLocation, setFilteredLocation] = useState("all");
  const { data: locations = [] } = useAllLocations();

  const filteredRecords = topLeaveRecords.filter(r => {
    const deptMatch = filteredDepartment === "all" || r.department === filteredDepartment;
    const locationMatch = filteredLocation === "all" || locations.find(s => s.id === filteredLocation)?.name === r.store;
    return deptMatch && locationMatch;
  });

  const exportData = {
    headers: ["Employee", "Department", "Store", "Leave Type", "Days", "Status"],
    rows: filteredRecords.map(r => [
      r.employee,
      r.department,
      r.store,
      r.type,
      r.days,
      r.status,
    ]),
    filename: "leave-report",
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Approved":
        return "secondary";
      case "Pending":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Leave Reports"
        description="Analyze leave patterns and utilization across the organization"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <ReportFilters
          departments={departments}
          stores={locations.map(s => ({ id: s.id, name: s.name }))}
          onDepartmentChange={setFilteredDepartment}
          onStoreChange={setFilteredLocation}
          showStoreFilter={true}
        />
        <ReportExport data={exportData} title="Leave Report" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Leave Days Used"
          value="525"
          icon={CalendarDays}
          subtitle="This year"
        />
        <StatCard
          title="Employees on Leave"
          value="8"
          icon={Users}
          subtitle="Currently"
        />
        <StatCard
          title="Avg. Leave/Employee"
          value="4.3 days"
          icon={Clock}
          subtitle="Per month"
        />
        <StatCard
          title="Leave Balance Used"
          value="22%"
          icon={TrendingDown}
          subtitle="Organization-wide"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="Leave Distribution by Type" data={leaveByTypeData} />
        <PieChartCard title="Leave Balance Summary" data={leaveBalanceSummary} />
        <LineChartCard
          title="Monthly Leave Trends"
          data={monthlyLeaveTrends}
          lines={[{ dataKey: "days", name: "Days" }]}
        />
        <BarChartCard
          title="Leave Days by Department"
          data={departmentLeaveData}
          horizontal
        />
      </div>

      {/* Leave Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Leave Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{record.employee}</TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.store}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell className="text-center">{record.days}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
