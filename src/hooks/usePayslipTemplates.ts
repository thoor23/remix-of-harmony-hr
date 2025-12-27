import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface PayslipTemplate {
  id: string;
  name: string;
  content: string;
  layout_config: Json;
  is_default: boolean | null;
  is_active: boolean | null;
  company_name: string | null;
  company_address: string | null;
  company_logo_url: string | null;
  footer_text: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const PAYSLIP_PLACEHOLDERS = [
  { key: "{{employee_name}}", label: "Employee Name", category: "Employee" },
  { key: "{{employee_id}}", label: "Employee ID", category: "Employee" },
  { key: "{{department}}", label: "Department", category: "Employee" },
  { key: "{{designation}}", label: "Designation", category: "Employee" },
  { key: "{{pay_period}}", label: "Pay Period", category: "Pay Info" },
  { key: "{{pay_date}}", label: "Pay Date", category: "Pay Info" },
  { key: "{{basic_salary}}", label: "Basic Salary", category: "Earnings" },
  { key: "{{hra}}", label: "HRA", category: "Earnings" },
  { key: "{{transport_allowance}}", label: "Transport Allowance", category: "Earnings" },
  { key: "{{medical_allowance}}", label: "Medical Allowance", category: "Earnings" },
  { key: "{{other_allowances}}", label: "Other Allowances", category: "Earnings" },
  { key: "{{gross_earnings}}", label: "Gross Earnings", category: "Earnings" },
  { key: "{{pf_deduction}}", label: "PF Deduction", category: "Deductions" },
  { key: "{{tax_deduction}}", label: "Tax Deduction", category: "Deductions" },
  { key: "{{other_deductions}}", label: "Other Deductions", category: "Deductions" },
  { key: "{{total_deductions}}", label: "Total Deductions", category: "Deductions" },
  { key: "{{net_pay}}", label: "Net Pay", category: "Totals" },
  { key: "{{company_name}}", label: "Company Name", category: "Company" },
  { key: "{{company_address}}", label: "Company Address", category: "Company" },
  { key: "{{footer_text}}", label: "Footer Text", category: "Company" },
  { key: "{{current_date}}", label: "Current Date", category: "Dates" },
];

export function usePayslipTemplates() {
  return useQuery({
    queryKey: ["payslip-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslip_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PayslipTemplate[];
    },
  });
}

export function usePayslipTemplate(id: string) {
  return useQuery({
    queryKey: ["payslip-template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslip_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as PayslipTemplate;
    },
    enabled: !!id,
  });
}

export function useDefaultPayslipTemplate() {
  return useQuery({
    queryKey: ["payslip-template-default"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslip_templates")
        .select("*")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as PayslipTemplate;
    },
  });
}

export function useCreatePayslipTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<PayslipTemplate, "id" | "created_at" | "updated_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("payslip_templates")
        .insert([{
          ...template,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslip-templates"] });
      toast.success("Payslip template created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useUpdatePayslipTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...template }: Partial<PayslipTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("payslip_templates")
        .update(template)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslip-templates"] });
      queryClient.invalidateQueries({ queryKey: ["payslip-template-default"] });
      toast.success("Payslip template updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeletePayslipTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payslip_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslip-templates"] });
      toast.success("Payslip template deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

export function useSetDefaultPayslipTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, unset any existing default
      await supabase
        .from("payslip_templates")
        .update({ is_default: false })
        .eq("is_default", true);

      // Then set the new default
      const { error } = await supabase
        .from("payslip_templates")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslip-templates"] });
      queryClient.invalidateQueries({ queryKey: ["payslip-template-default"] });
      toast.success("Default template updated");
    },
    onError: (error) => {
      toast.error(`Failed to set default: ${error.message}`);
    },
  });
}
