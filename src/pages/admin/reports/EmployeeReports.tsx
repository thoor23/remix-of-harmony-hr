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
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeReportData, processEmployeeData } from "@/hooks/useReportData";
import { useDepartmentsData } from "@/hooks/useDepartments";
import { useStores } from "@/hooks/useStores";

export default function EmployeeReports() {
  const [filteredDepartment, setFilteredDepartment] = useState("all");
  const [filteredStore, setFilteredStore] = useState("all");

  const { data: employees = [], isLoading } = useEmployeeReportData();
  const { data: departments = [] } = useDepartmentsData();
  const { data: stores = [] } = useStores();

  const departmentNames = departments.map((d: any) => d.name);

  // Filter employees by department and store
  const filteredEmployees = employees.filter((emp: any) => {
    const deptMatch = filteredDepartment === "all" || emp.department?.name === filteredDepartment;
    const storeMatch = filteredStore === "all" || emp.primary_store_id === filteredStore;
    return deptMatch && storeMatch;
  });

  // Process data for charts
  const { departmentData, employmentTypeData, statusData } = processEmployeeData(employees);

  // Calculate tenure data from employees
  const tenureData = (() => {
    const buckets: Record<string, number> = {
      "< 1 year": 0,
      "1-2 years": 0,
      "2-3 years": 0,
      "3-5 years": 0,
      "5+ years": 0,
    };

    employees.forEach((emp: any) => {
      if (!emp.date_of_joining) return;
      const years = (Date.now() - new Date(emp.date_of_joining).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years < 1) buckets["< 1 year"]++;
      else if (years < 2) buckets["1-2 years"]++;
      else if (years < 3) buckets["2-3 years"]++;
      else if (years < 5) buckets["3-5 years"]++;
      else buckets["5+ years"]++;
    });

    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  })();

  const getStoreName = (storeId: string | null) => {
    if (!storeId) return "Unassigned";
    return stores.find(s => s.id === storeId)?.name || "Unknown";
  };

  const exportData = {
    headers: ["Employee ID", "Name", "Department", "Store", "Designation", "Join Date", "Status"],
    rows: filteredEmployees.map((emp: any) => [
      emp.employee_id,
      `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "N/A",
      emp.department?.name || "Unassigned",
      getStoreName(emp.primary_store_id),
      emp.designation?.name || "N/A",
      emp.date_of_joining,
      emp.status,
    ]),
    filename: "employee-report",
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Employee Reports"
          description="Analyze workforce demographics and employee data"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Employee Reports"
        description="Analyze workforce demographics and employee data"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <ReportFilters
          departments={departmentNames}
          stores={stores.map(s => ({ id: s.id, name: s.name }))}
          onDepartmentChange={setFilteredDepartment}
          onStoreChange={setFilteredStore}
          showStoreFilter={true}
        />
        <ReportExport data={exportData} title="Employee Report" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="Headcount by Department" data={departmentData} />
        <PieChartCard title="Employment Type Distribution" data={employmentTypeData} />
        <PieChartCard title="Employee Status" data={statusData} />
        <BarChartCard title="Employee Tenure Distribution" data={tenureData} />
      </div>

      {/* Employee Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Employee Directory ({filteredEmployees.length} employees)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.slice(0, 20).map((employee: any) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employee_id}</TableCell>
                  <TableCell>
                    {`${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "N/A"}
                  </TableCell>
                  <TableCell>{employee.department?.name || "Unassigned"}</TableCell>
                  <TableCell>{getStoreName(employee.primary_store_id)}</TableCell>
                  <TableCell>{employee.designation?.name || "N/A"}</TableCell>
                  <TableCell>{employee.date_of_joining}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.status === "active" ? "default" : "secondary"}
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredEmployees.length > 20 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing 20 of {filteredEmployees.length} employees. Export for full list.
            </p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
