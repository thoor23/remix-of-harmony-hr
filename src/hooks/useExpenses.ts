import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
      const data = await api.get<ExpenseCategory[]>("/expenses/categories");
      return data;
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<ExpenseCategory>) => {
      return api.post<ExpenseCategory>("/expenses/categories", category);
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
      return api.put<ExpenseCategory>(`/expenses/categories/${id}`, data);
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
      return api.delete(`/expenses/categories/${id}`);
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
      const data = await api.get<ExpensePolicy[]>("/expenses/policies");
      return data;
    },
  });
}

export function useCreateExpensePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<ExpensePolicy>) => {
      return api.post<ExpensePolicy>("/expenses/policies", policy);
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
      return api.put<ExpensePolicy>(`/expenses/policies/${id}`, data);
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
      return api.delete(`/expenses/policies/${id}`);
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
      const data = await api.get<ExpenseClaim[]>("/expenses");
      return data;
    },
  });
}

export function useMyExpenseClaims() {
  return useQuery({
    queryKey: ["my-expense-claims"],
    queryFn: async () => {
      const data = await api.get<ExpenseClaim[]>("/expenses/my");
      return data;
    },
  });
}

export function useExpenseStats() {
  return useQuery({
    queryKey: ["expense-stats"],
    queryFn: async () => {
      const data = await api.get<ExpenseStats>("/expenses/stats");
      return data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Partial<ExpenseClaim>) => {
      return api.post<ExpenseClaim>("/expenses", expense);
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
      return api.patch<ExpenseClaim>(`/expenses/${id}`, data);
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
      return api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["my-expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
    },
  });
}
