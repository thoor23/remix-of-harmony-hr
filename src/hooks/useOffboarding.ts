import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export interface OffboardingProcess {
  id: string;
  employee_id: string;
  exit_type: 'resignation' | 'termination' | 'retirement' | 'layoff' | 'contract_end' | 'absconding';
  resignation_date: string | null;
  last_working_day: string;
  notice_period_days: number;
  exit_reason: string | null;
  status: 'initiated' | 'in_progress' | 'clearance_pending' | 'fnf_pending' | 'completed' | 'cancelled';
  handover_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
    avatar_url: string | null;
    date_of_joining: string;
    department?: { name: string } | null;
    designation?: { name: string } | null;
  };
  handover_employee?: {
    first_name: string;
    last_name: string;
  } | null;
  tasks?: OffboardingTask[];
  exit_interview?: ExitInterview | null;
  fnf_settlement?: FnFSettlement | null;
}

export interface OffboardingTask {
  id: string;
  offboarding_id: string;
  title: string;
  description: string | null;
  category: 'knowledge_transfer' | 'asset_return' | 'access_revocation' | 'documentation' | 'clearance';
  assigned_to: string | null;
  department_id: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  completed_at: string | null;
  completed_by: string | null;
  order_index: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    first_name: string;
    last_name: string;
  } | null;
  department?: { name: string } | null;
}

export interface ExitInterview {
  id: string;
  offboarding_id: string;
  conducted_by: string | null;
  interview_date: string | null;
  reason_for_leaving: string | null;
  feedback: Record<string, any>;
  overall_rating: number | null;
  would_rejoin: boolean | null;
  would_recommend: boolean | null;
  suggestions: string | null;
  status: 'pending' | 'scheduled' | 'completed' | 'skipped';
  created_at: string;
  updated_at: string;
  conductor?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface FnFSettlement {
  id: string;
  offboarding_id: string;
  pending_salary_days: number;
  pending_salary_amount: number;
  leave_encashment_days: number;
  leave_encashment_amount: number;
  bonus_amount: number;
  gratuity_amount: number;
  other_earnings: number;
  other_earnings_notes: string | null;
  advance_deduction: number;
  loan_deduction: number;
  notice_period_deduction: number;
  other_deductions: number;
  other_deductions_notes: string | null;
  total_earnings: number;
  total_deductions: number;
  final_amount: number;
  status: 'pending' | 'calculated' | 'approved' | 'processed' | 'paid';
  processed_by: string | null;
  processed_at: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Processes
export function useOffboardingProcesses(status?: string) {
  return useQuery({
    queryKey: ["offboarding-processes", status],
    queryFn: async () => {
      const url = status ? `/offboarding?status=${status}` : "/offboarding";
      const response = await apiRequest(url);
      return response as OffboardingProcess[];
    },
  });
}

export function useOffboardingProcess(id: string) {
  return useQuery({
    queryKey: ["offboarding-process", id],
    queryFn: async () => {
      const response = await apiRequest(`/offboarding/${id}`);
      return response as OffboardingProcess;
    },
    enabled: !!id,
  });
}

export function useInitiateOffboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      employee_id: string;
      exit_type: string;
      resignation_date?: string;
      last_working_day: string;
      notice_period_days?: number;
      exit_reason?: string;
      handover_to?: string;
      notes?: string;
    }) => {
      return apiRequest("/offboarding", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
    },
  });
}

export function useUpdateOffboardingProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; notes?: string }) => {
      return apiRequest(`/offboarding/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.id] });
    },
  });
}

// Tasks
export function useUpdateOffboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      offboardingId, 
      taskId, 
      ...data 
    }: { 
      offboardingId: string; 
      taskId: string; 
      status?: string;
      notes?: string;
      completed_at?: string | null;
    }) => {
      return apiRequest(`/offboarding/${offboardingId}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
    },
  });
}

// Exit Interview
export function useSaveExitInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      offboardingId, 
      ...data 
    }: { 
      offboardingId: string;
      interview_date?: string;
      reason_for_leaving?: string;
      feedback?: Record<string, any>;
      overall_rating?: number;
      would_rejoin?: boolean;
      would_recommend?: boolean;
      suggestions?: string;
      status?: string;
    }) => {
      return apiRequest(`/offboarding/${offboardingId}/interview`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
    },
  });
}

// FnF Settlement
export function useCalculateFnF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      offboardingId, 
      ...data 
    }: { 
      offboardingId: string;
      pending_salary_days?: number;
      pending_salary_amount?: number;
      leave_encashment_days?: number;
      leave_encashment_amount?: number;
      bonus_amount?: number;
      gratuity_amount?: number;
      other_earnings?: number;
      other_earnings_notes?: string;
      advance_deduction?: number;
      loan_deduction?: number;
      notice_period_deduction?: number;
      other_deductions?: number;
      other_deductions_notes?: string;
    }) => {
      return apiRequest(`/offboarding/${offboardingId}/fnf`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
    },
  });
}

export function useUpdateFnFStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      offboardingId, 
      status,
      payment_reference,
      payment_date,
    }: { 
      offboardingId: string;
      status: string;
      payment_reference?: string;
      payment_date?: string;
    }) => {
      return apiRequest(`/offboarding/${offboardingId}/fnf/status`, {
        method: "PUT",
        body: JSON.stringify({ status, payment_reference, payment_date }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
    },
  });
}

// Stats
export function useOffboardingStats() {
  return useQuery({
    queryKey: ["offboarding-stats"],
    queryFn: async () => {
      const response = await apiRequest("/offboarding/stats");
      return response as {
        active: number;
        in_notice_period: number;
        fnf_pending: number;
        completed_this_month: number;
      };
    },
  });
}
