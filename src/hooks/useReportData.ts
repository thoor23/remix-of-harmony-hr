import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/supabase-helpers";

interface Employee {
  id: string;
  employee_id: string;
  status: string;
  employment_type: string;
  date_of_joining: string;
  department?: { name: string };
  designation?: { name: string };
  email?: string;
  first_name?: string;
  last_name?: string;
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
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          designation:designations(name)
        `)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return (data || []) as unknown as Employee[];
    },
  });
}

export function useAttendanceReportData(month?: string) {
  return useQuery({
    queryKey: ["report-attendance", month],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name)
        `)
        .eq('company_id', companyId);
      
      if (month) {
        query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as AttendanceRecord[];
    },
  });
}

export function useLeaveReportData() {
  return useQuery({
    queryKey: ["report-leaves"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(name, code),
          employee:employees(id, employee_id, first_name, last_name)
        `)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return (data || []) as unknown as LeaveRequest[];
    },
  });
}

export function usePayrollReportData() {
  return useQuery({
    queryKey: ["report-payroll"],
    queryFn: async () => {
      const companyId = await getCurrentCompanyId();
      
      const { data, error } = await supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name)
        `)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return (data || []) as unknown as Payslip[];
    },
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
