import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

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
      const response = await apiRequest("/onboarding/templates");
      return response as OnboardingTemplate[];
    },
  });
}

export function useOnboardingTemplate(id: string) {
  return useQuery({
    queryKey: ["onboarding-template", id],
    queryFn: async () => {
      const response = await apiRequest(`/onboarding/templates/${id}`);
      return response as OnboardingTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnboardingTemplate>) => {
      return apiRequest("/onboarding/templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
    },
  });
}

export function useUpdateOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OnboardingTemplate> & { id: string }) => {
      return apiRequest(`/onboarding/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
    },
  });
}

export function useDeleteOnboardingTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/onboarding/templates/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-templates"] });
    },
  });
}

// Processes
export function useOnboardingProcesses(status?: string) {
  return useQuery({
    queryKey: ["onboarding-processes", status],
    queryFn: async () => {
      const url = status ? `/onboarding?status=${status}` : "/onboarding";
      const response = await apiRequest(url);
      return response as OnboardingProcess[];
    },
  });
}

export function useOnboardingProcess(id: string) {
  return useQuery({
    queryKey: ["onboarding-process", id],
    queryFn: async () => {
      const response = await apiRequest(`/onboarding/${id}`);
      return response as OnboardingProcess;
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
      return apiRequest("/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-processes"] });
    },
  });
}

export function useUpdateOnboardingProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; notes?: string }) => {
      return apiRequest(`/onboarding/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-processes"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-process", variables.id] });
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
      return apiRequest(`/onboarding/${onboardingId}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-process", variables.onboardingId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-processes"] });
    },
  });
}

// Stats
export function useOnboardingStats() {
  return useQuery({
    queryKey: ["onboarding-stats"],
    queryFn: async () => {
      const response = await apiRequest("/onboarding/stats");
      return response as {
        active: number;
        pending: number;
        completed_this_month: number;
        overdue_tasks: number;
      };
    },
  });
}
