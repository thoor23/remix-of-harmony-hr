import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function usePayslips(payPeriod?: string) {
  return useQuery({
    queryKey: ["payslips", payPeriod],
    queryFn: async () => {
      const params = payPeriod ? `?pay_period=${payPeriod}` : '';
      return api.get<any[]>(`/payroll/payslips${params}`);
    },
  });
}

export function useMyPayslips(employeeId: string) {
  return useQuery({
    queryKey: ["my-payslips", employeeId],
    queryFn: () => api.get<any[]>(`/payroll/payslips/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: ["salary-structures"],
    queryFn: () => api.get<any[]>('/payroll/salary-structures'),
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (structure: {
      employee_id: string;
      basic_salary: number;
      hra?: number;
      transport_allowance?: number;
      medical_allowance?: number;
      other_allowances?: number;
      pf_deduction?: number;
      tax_deduction?: number;
      other_deductions?: number;
      effective_from: string;
    }) => {
      await api.post('/payroll/salary-structures', structure);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
      toast.success("Salary structure created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create salary structure: ${error.message}`);
    },
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        basic_salary?: number;
        hra?: number;
        transport_allowance?: number;
        medical_allowance?: number;
        other_allowances?: number;
        pf_deduction?: number;
        tax_deduction?: number;
        other_deductions?: number;
        effective_from?: string;
      };
    }) => {
      await api.put(`/payroll/salary-structures/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures"] });
      toast.success("Salary structure updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update salary structure: ${error.message}`);
    },
  });
}

export function useGeneratePayslip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payslip: {
      employee_id: string;
      pay_period: string;
      pay_date: string;
      basic_salary: number;
      gross_earnings: number;
      total_deductions: number;
      net_pay: number;
    }) => {
      await api.post('/payroll/payslips', {
        ...payslip,
        status: "generated",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Payslip generated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate payslip: ${error.message}`);
    },
  });
}
