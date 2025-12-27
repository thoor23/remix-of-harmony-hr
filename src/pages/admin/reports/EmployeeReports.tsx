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
import { Badge } from "@/components/ui/badge";

const departmentData = [
  { name: "Engineering", value: 45 },
  { name: "Sales", value: 30 },
  { name: "Marketing", value: 20 },
  { name: "HR", value: 15 },
  { name: "Finance", value: 12 },
];

const employmentTypeData = [
  { name: "Full-time", value: 95 },
  { name: "Part-time", value: 15 },
  { name: "Contract", value: 8 },
  { name: "Intern", value: 4 },
];

const monthlyHiresData = [
  { name: "Jul", hires: 3, exits: 1 },
  { name: "Aug", hires: 5, exits: 2 },
  { name: "Sep", hires: 4, exits: 1 },
  { name: "Oct", hires: 6, exits: 3 },
  { name: "Nov", hires: 8, exits: 2 },
  { name: "Dec", hires: 4, exits: 1 },
];

const tenureData = [
  { name: "< 1 year", value: 28 },
  { name: "1-2 years", value: 35 },
  { name: "2-3 years", value: 25 },
  { name: "3-5 years", value: 18 },
  { name: "5+ years", value: 16 },
];

const employeeDirectory = [
  { id: "EMP001", name: "John Smith", department: "Engineering", designation: "Senior Developer", joinDate: "2022-03-15", status: "Active" },
  { id: "EMP002", name: "Sarah Johnson", department: "Marketing", designation: "Marketing Manager", joinDate: "2021-08-20", status: "Active" },
  { id: "EMP003", name: "Mike Chen", department: "Sales", designation: "Sales Executive", joinDate: "2023-01-10", status: "Active" },
  { id: "EMP004", name: "Emily Davis", department: "HR", designation: "HR Specialist", joinDate: "2022-06-01", status: "On Leave" },
  { id: "EMP005", name: "Alex Wilson", department: "Finance", designation: "Accountant", joinDate: "2020-11-25", status: "Active" },
];

const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];

export default function EmployeeReports() {
  const [filteredDepartment, setFilteredDepartment] = useState("all");

  const filteredEmployees = filteredDepartment === "all"
    ? employeeDirectory
    : employeeDirectory.filter(emp => emp.department === filteredDepartment);

  const exportData = {
    headers: ["Employee ID", "Name", "Department", "Designation", "Join Date", "Status"],
    rows: filteredEmployees.map(emp => [
      emp.id,
      emp.name,
      emp.department,
      emp.designation,
      emp.joinDate,
      emp.status,
    ]),
    filename: "employee-report",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Employee Reports"
        description="Analyze workforce demographics and employee data"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <ReportFilters
          departments={departments}
          onDepartmentChange={setFilteredDepartment}
        />
        <ReportExport data={exportData} title="Employee Report" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="Headcount by Department" data={departmentData} />
        <PieChartCard title="Employment Type Distribution" data={employmentTypeData} />
        <LineChartCard
          title="Monthly Hiring vs Exits"
          data={monthlyHiresData}
          lines={[
            { dataKey: "hires", name: "New Hires" },
            { dataKey: "exits", name: "Exits" },
          ]}
        />
        <BarChartCard title="Employee Tenure Distribution" data={tenureData} />
      </div>

      {/* Employee Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.designation}</TableCell>
                  <TableCell>{employee.joinDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.status === "Active" ? "default" : "secondary"}
                    >
                      {employee.status}
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
