import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePayslips(payPeriod?: string) {
  return useQuery({
    queryKey: ["payslips", payPeriod],
    queryFn: async () => {
      let query = supabase
        .from("payslips")
        .select(`
          *,
          employee:employees(
            id,
            employee_id,
            user_id,
            department:departments(id, name)
          )
        `)
        .order("created_at", { ascending: false });

      if (payPeriod) {
        query = query.eq("pay_period", payPeriod);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles
      const userIds = data?.map(p => p.employee?.user_id).filter(Boolean) || [];
      let profiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      return data?.map(payslip => ({
        ...payslip,
        employee: payslip.employee ? {
          ...payslip.employee,
          profile: payslip.employee.user_id ? profiles[payslip.employee.user_id] : null
        } : null
      }));
    },
  });
}

export function useMyPayslips(employeeId: string) {
  return useQuery({
    queryKey: ["my-payslips", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .eq("employee_id", employeeId)
        .order("pay_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: ["salary-structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_structures")
        .select(`
          *,
          employee:employees(
            id,
            employee_id,
            user_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from("payslips")
        .insert({
          ...payslip,
          status: "generated",
        });

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
