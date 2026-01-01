import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  designation_id: string | null;
  tasks: OnboardingTaskTemplate[];
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTaskTemplate {
  title: string;
  description?: string;
  category: 'pre_joining' | 'day_one' | 'week_one' | 'month_one';
  order: number;
}

export interface OnboardingProcess {
  id: string;
  employee_id: string;
  template_id: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  expected_completion_date: string | null;
  completed_date: string | null;
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
    department?: { name: string } | null;
    designation?: { name: string } | null;
  };
  template?: OnboardingTemplate | null;
  tasks?: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  onboarding_id: string;
  title: string;
  description: string | null;
  category: 'pre_joining' | 'day_one' | 'week_one' | 'month_one';
  assigned_to: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at: string | null;
  completed_by: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  assignee?: {
    first_name: string;
    last_name: string;
  } | null;
}

// Templates
export function useOnboardingTemplates() {
  return useQuery({
    queryKey: ["onboarding-templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return (data || []) as unknown as OnboardingTemplate[];
    },
  });
}

export function useOnboardingTemplate(id: string) {
  return useQuery({
    queryKey: ["onboarding-template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as OnboardingTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnboardingTemplate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: result, error } = await supabase
        .from('onboarding_templates')
        .insert([{ ...data, company_id: companyId } as any])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OnboardingTemplate> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('onboarding_templates')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('onboarding_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Processes
export function useOnboardingProcesses(status?: string) {
  return useQuery({
    queryKey: ["onboarding-processes", status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('onboarding_processes')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email, employee_id, avatar_url, department:departments(name), designation:designations(name)),
          template:onboarding_templates(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as OnboardingProcess[];
    },
  });
}

export function useOnboardingProcess(id: string) {
  return useQuery({
    queryKey: ["onboarding-process", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_processes')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email, employee_id, avatar_url, department:departments(name), designation:designations(name)),
          template:onboarding_templates(*),
          tasks:onboarding_tasks(*, assignee:employees!onboarding_tasks_assigned_to_fkey(first_name, last_name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as OnboardingProcess;
    },
    enabled: !!id,
  });
}

export function useStartOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      employee_id: string;
      template_id?: string;
      start_date?: string;
      expected_completion_date?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: result, error } = await supabase
        .from('onboarding_processes')
        .insert([{
          ...data,
          company_id: companyId,
          created_by: employeeId,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-processes"] });
      toast.success('Onboarding started successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOnboardingProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; notes?: string }) => {
      const { data: result, error } = await supabase
        .from('onboarding_processes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-processes"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-process", variables.id] });
      toast.success('Onboarding updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Tasks
export function useUpdateOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      onboardingId, 
      taskId, 
      ...data 
    }: { 
      onboardingId: string; 
      taskId: string; 
      status?: string;
      completed_at?: string | null;
    }) => {
      const { data: result, error } = await supabase
        .from('onboarding_tasks')
        .update(data)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-process", variables.onboardingId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-processes"] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Stats
export function useOnboardingStats() {
  return useQuery({
    queryKey: ["onboarding-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('onboarding_processes')
        .select('status')
        .eq('company_id', companyId);

      if (error) throw error;

      return {
        active: data.filter(p => p.status === 'in_progress').length,
        pending: data.filter(p => p.status === 'pending').length,
        completed_this_month: data.filter(p => p.status === 'completed').length,
        overdue_tasks: 0,
      };
    },
  });
}
