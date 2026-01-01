import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  max_amount: number;
  requires_receipt: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpensePolicy {
  id: string;
  name: string;
  max_monthly_limit: number;
  requires_manager_approval: boolean;
  auto_approve_below: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseClaim {
  id: string;
  employee_id: string;
  category_id: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  reimbursed_at: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    employee_id: string;
    avatar_url: string | null;
    department?: { id: string; name: string } | null;
  };
  reviewer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface ExpenseStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  reimbursed: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
}

// ============== CATEGORY HOOKS ==============
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as ExpenseCategory[];
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<ExpenseCategory>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{ ...category, company_id: companyId } as any])
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExpenseCategory> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('expense_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

// ============== POLICY HOOKS ==============
export function useExpensePolicies() {
  return useQuery({
    queryKey: ["expense-policies"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('expense_policies')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as ExpensePolicy[];
    },
  });
}

export function useCreateExpensePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<ExpensePolicy>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('expense_policies')
        .insert([{ ...policy, company_id: companyId } as any])
        .select()
        .single();

      if (error) throw error;
      return data as ExpensePolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-policies"] });
    },
  });
}

export function useUpdateExpensePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExpensePolicy> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('expense_policies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ExpensePolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-policies"] });
    },
  });
}

export function useDeleteExpensePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expense_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-policies"] });
    },
  });
}

// ============== EXPENSE CLAIM HOOKS ==============
export function useExpenseClaims() {
  return useQuery({
    queryKey: ["expense-claims"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('expense_claims')
        .select(`
          *,
          category:expense_categories(*),
          employee:employees(id, first_name, last_name, employee_id, avatar_url, department:departments(id, name))
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ExpenseClaim[];
    },
  });
}

export function useMyExpenseClaims() {
  return useQuery({
    queryKey: ["my-expense-claims"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      const { data, error } = await supabase
        .from('expense_claims')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ExpenseClaim[];
    },
  });
}

export function useExpenseStats() {
  return useQuery({
    queryKey: ["expense-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('expense_claims')
        .select('status, amount')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats: ExpenseStats = {
        total: data?.length || 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        reimbursed: 0,
        totalAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
      };

      data?.forEach((claim: any) => {
        stats.totalAmount += claim.amount || 0;
        if (claim.status === 'pending') {
          stats.pending++;
          stats.pendingAmount += claim.amount || 0;
        } else if (claim.status === 'approved') {
          stats.approved++;
          stats.approvedAmount += claim.amount || 0;
        } else if (claim.status === 'rejected') {
          stats.rejected++;
        } else if (claim.status === 'reimbursed') {
          stats.reimbursed++;
        }
      });

      return stats;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Partial<ExpenseClaim>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      const insertData: any = {
        ...expense,
        employee_id: employeeId,
        company_id: companyId,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('expense_claims')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as ExpenseClaim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["my-expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ExpenseClaim> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('expense_claims')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ExpenseClaim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["my-expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expense_claims')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["my-expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    },
  });
}
