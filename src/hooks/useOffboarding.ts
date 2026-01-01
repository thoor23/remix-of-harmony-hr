import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('offboarding_processes')
        .select(`
          *,
          employee:employees!offboarding_processes_employee_id_fkey(id, first_name, last_name, email, employee_id, avatar_url, date_of_joining, department:departments(name), designation:designations(name)),
          handover_employee:employees!offboarding_processes_handover_to_fkey(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as OffboardingProcess[];
    },
  });
}

export function useOffboardingProcess(id: string) {
  return useQuery({
    queryKey: ["offboarding-process", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offboarding_processes')
        .select(`
          *,
          employee:employees!offboarding_processes_employee_id_fkey(id, first_name, last_name, email, employee_id, avatar_url, date_of_joining, department:departments(name), designation:designations(name)),
          handover_employee:employees!offboarding_processes_handover_to_fkey(first_name, last_name),
          tasks:offboarding_tasks(*, assignee:employees!offboarding_tasks_assigned_to_fkey(first_name, last_name), department:departments(name)),
          exit_interview:exit_interviews(*),
          fnf_settlement:fnf_settlements(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as OffboardingProcess;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: result, error } = await supabase
        .from('offboarding_processes')
        .insert([{
          ...data,
          company_id: companyId,
          created_by: employeeId,
          status: 'initiated',
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
      toast.success('Offboarding initiated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOffboardingProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; notes?: string }) => {
      const { data: result, error } = await supabase
        .from('offboarding_processes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.id] });
      toast.success('Offboarding updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
      const { data: result, error } = await supabase
        .from('offboarding_tasks')
        .update(data)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      // Check if exit interview exists
      const { data: existing } = await supabase
        .from('exit_interviews')
        .select('id')
        .eq('offboarding_id', offboardingId)
        .single();

      if (existing) {
        const { data: result, error } = await supabase
          .from('exit_interviews')
          .update({ ...data, conducted_by: employeeId })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('exit_interviews')
          .insert([{
            ...data,
            offboarding_id: offboardingId,
            company_id: companyId,
            conducted_by: employeeId,
          }])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
      toast.success('Exit interview saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      // Calculate totals
      const total_earnings = (data.pending_salary_amount || 0) + (data.leave_encashment_amount || 0) + 
        (data.bonus_amount || 0) + (data.gratuity_amount || 0) + (data.other_earnings || 0);
      const total_deductions = (data.advance_deduction || 0) + (data.loan_deduction || 0) + 
        (data.notice_period_deduction || 0) + (data.other_deductions || 0);
      const final_amount = total_earnings - total_deductions;

      // Check if FnF settlement exists
      const { data: existing } = await supabase
        .from('fnf_settlements')
        .select('id')
        .eq('offboarding_id', offboardingId)
        .single();

      if (existing) {
        const { data: result, error } = await supabase
          .from('fnf_settlements')
          .update({ ...data, total_earnings, total_deductions, final_amount, status: 'calculated' })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('fnf_settlements')
          .insert([{
            ...data,
            offboarding_id: offboardingId,
            company_id: companyId,
            total_earnings,
            total_deductions,
            final_amount,
            status: 'calculated',
          }])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
      toast.success('F&F calculated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);

      const { data: result, error } = await supabase
        .from('fnf_settlements')
        .update({ 
          status, 
          payment_reference, 
          payment_date,
          processed_by: employeeId,
          processed_at: new Date().toISOString(),
        })
        .eq('offboarding_id', offboardingId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offboarding-process", variables.offboardingId] });
      queryClient.invalidateQueries({ queryKey: ["offboarding-processes"] });
      toast.success('F&F status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Stats
export function useOffboardingStats() {
  return useQuery({
    queryKey: ["offboarding-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('offboarding_processes')
        .select('status')
        .eq('company_id', companyId);

      if (error) throw error;

      return {
        active: data.filter(p => ['initiated', 'in_progress', 'clearance_pending'].includes(p.status)).length,
        in_notice_period: data.filter(p => p.status === 'initiated').length,
        fnf_pending: data.filter(p => p.status === 'fnf_pending').length,
        completed_this_month: data.filter(p => p.status === 'completed').length,
      };
    },
  });
}
