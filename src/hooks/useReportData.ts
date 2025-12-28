import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Employee {
  id: string;
  employee_id: string;
  status: string;
  employment_type: string;
  date_of_joining: string;
  department?: { name: string };
  designation?: { name: string };
  user?: { email: string };
  profile?: { first_name: string; last_name: string };
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  work_hours: number | null;
  employee?: Employee;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  leave_type?: { name: string; code: string };
  employee?: Employee;
}

interface Payslip {
  id: string;
  employee_id: string;
  pay_period: string;
  pay_date: string;
  basic_salary: number;
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  employee?: Employee;
}

export function useEmployeeReportData() {
  return useQuery({
    queryKey: ["report-employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  });
}

export function useAttendanceReportData(month?: string) {
  return useQuery({
    queryKey: ["report-attendance", month],
    queryFn: () => api.get<AttendanceRecord[]>(`/attendance${month ? `?month=${month}` : ""}`),
  });
}

export function useLeaveReportData() {
  return useQuery({
    queryKey: ["report-leaves"],
    queryFn: () => api.get<LeaveRequest[]>("/leaves"),
  });
}

export function usePayrollReportData() {
  return useQuery({
    queryKey: ["report-payroll"],
    queryFn: () => api.get<Payslip[]>("/payroll/payslips"),
  });
}

// Helper functions for report data processing
export function processEmployeeData(employees: Employee[]) {
  const departmentCounts: Record<string, number> = {};
  const employmentTypeCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  employees.forEach((emp) => {
    // Department distribution
    const dept = emp.department?.name || "Unassigned";
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

    // Employment type distribution
    const type = emp.employment_type || "Unknown";
    employmentTypeCounts[type] = (employmentTypeCounts[type] || 0) + 1;

    // Status distribution
    const status = emp.status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return {
    departmentData: Object.entries(departmentCounts).map(([name, value]) => ({ name, value })),
    employmentTypeData: Object.entries(employmentTypeCounts).map(([name, value]) => ({ name, value })),
    statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    total: employees.length,
  };
}

export function processAttendanceData(records: AttendanceRecord[]) {
  const statusCounts: Record<string, number> = {};
  let totalHours = 0;
  let recordsWithHours = 0;

  records.forEach((record) => {
    const status = record.status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (record.work_hours) {
      totalHours += record.work_hours;
      recordsWithHours++;
    }
  });

  return {
    statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    averageHours: recordsWithHours > 0 ? (totalHours / recordsWithHours).toFixed(2) : 0,
    total: records.length,
    presentCount: statusCounts["present"] || 0,
    absentCount: statusCounts["absent"] || 0,
    lateCount: statusCounts["late"] || 0,
  };
}

export function processLeaveData(leaves: LeaveRequest[]) {
  const typeCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  let totalDays = 0;

  leaves.forEach((leave) => {
    const type = leave.leave_type?.name || "Unknown";
    typeCounts[type] = (typeCounts[type] || 0) + leave.days;

    const status = leave.status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (leave.status === "approved") {
      totalDays += leave.days;
    }
  });

  return {
    typeData: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
    statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    totalDays,
    total: leaves.length,
    pendingCount: statusCounts["pending"] || 0,
    approvedCount: statusCounts["approved"] || 0,
  };
}

export function processPayrollData(payslips: Payslip[]) {
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  const monthlyData: Record<string, { gross: number; net: number; count: number }> = {};

  payslips.forEach((slip) => {
    totalGross += slip.gross_earnings;
    totalDeductions += slip.total_deductions;
    totalNet += slip.net_pay;

    const month = slip.pay_period;
    if (!monthlyData[month]) {
      monthlyData[month] = { gross: 0, net: 0, count: 0 };
    }
    monthlyData[month].gross += slip.gross_earnings;
    monthlyData[month].net += slip.net_pay;
    monthlyData[month].count++;
  });

  return {
    monthlyData: Object.entries(monthlyData).map(([name, data]) => ({
      name,
      gross: data.gross,
      net: data.net,
      count: data.count,
    })),
    totalGross,
    totalDeductions,
    totalNet,
    total: payslips.length,
  };
}
