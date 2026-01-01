import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export function usePayslips(payPeriod?: string) {
  return useQuery({
    queryKey: ["payslips", payPeriod],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('pay_date', { ascending: false });

      if (payPeriod) {
        query = query.eq('pay_period', payPeriod);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyPayslips(employeeId: string) {
  return useQuery({
    queryKey: ["my-payslips", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('pay_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: ["salary-structures"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('salary_structures')
        .select(`
          *,
          employee:employees(id, employee_id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('salary_structures')
        .insert([{ ...structure, company_id: companyId }]);

      if (error) throw error;
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
      const { error } = await supabase
        .from('salary_structures')
        .update(data)
        .eq('id', id);

      if (error) throw error;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { error } = await supabase
        .from('payslips')
        .insert([{
          ...payslip,
          company_id: companyId,
          status: "generated",
        }]);

      if (error) throw error;
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
