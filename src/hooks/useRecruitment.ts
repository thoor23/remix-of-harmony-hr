import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  JobOpening,
  JobApplication,
  InterviewSchedule,
  RecruitmentStats,
  PipelineStats,
  CreateJobOpeningInput,
  CreateApplicationInput,
  ScheduleInterviewInput,
  SubmitFeedbackInput,
  ConvertToEmployeeInput,
  ApplicationStage,
} from "@/types/recruitment";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-recruitment`;

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${FUNCTION_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// === STATS ===
export function useRecruitmentStats() {
  return useQuery<RecruitmentStats>({
    queryKey: ["recruitment", "stats"],
    queryFn: () => apiRequest("/stats"),
  });
}

export function usePipelineStats() {
  return useQuery<PipelineStats>({
    queryKey: ["recruitment", "pipeline"],
    queryFn: () => apiRequest("/pipeline"),
  });
}

// === JOB OPENINGS ===
export function useJobOpenings(filters?: { status?: string; department_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.department_id) params.set("department_id", filters.department_id);
  const query = params.toString() ? `?${params.toString()}` : "";

  return useQuery<JobOpening[]>({
    queryKey: ["recruitment", "jobs", filters],
    queryFn: () => apiRequest(`/jobs${query}`),
  });
}

export function useJobOpening(id: string) {
  return useQuery<JobOpening>({
    queryKey: ["recruitment", "jobs", id],
    queryFn: () => apiRequest(`/jobs/${id}`),
    enabled: !!id,
  });
}

export function useCreateJobOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJobOpeningInput) =>
      apiRequest<JobOpening>("/jobs", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      toast.success("Job opening created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateJobOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobOpening> }) =>
      apiRequest<JobOpening>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs", id] });
      toast.success("Job opening updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteJobOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      toast.success("Job opening deleted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest<JobOpening>(`/jobs/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      toast.success("Job status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// === APPLICATIONS ===
export function useApplications(filters?: { job_id?: string; stage?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.job_id) params.set("job_id", filters.job_id);
  if (filters?.stage) params.set("stage", filters.stage);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";

  return useQuery<JobApplication[]>({
    queryKey: ["recruitment", "applications", filters],
    queryFn: () => apiRequest(`/applications${query}`),
  });
}

export function useApplication(id: string) {
  return useQuery<JobApplication>({
    queryKey: ["recruitment", "applications", id],
    queryFn: () => apiRequest(`/applications/${id}`),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      apiRequest<JobApplication>("/applications", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "pipeline"] });
      toast.success("Application created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobApplication> }) =>
      apiRequest<JobApplication>(`/applications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications", id] });
      toast.success("Application updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateApplicationStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, notes }: { id: string; stage: ApplicationStage; notes?: string }) =>
      apiRequest<JobApplication>(`/applications/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage, notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications", id] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "pipeline"] });
      toast.success("Application stage updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
      apiRequest<JobApplication>(`/applications/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason, notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications", id] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      toast.success("Application rejected");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useConvertToEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: { applicationId: string; data: ConvertToEmployeeInput }) =>
      apiRequest(`/applications/${applicationId}/convert`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "applications", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Candidate converted to employee");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// === INTERVIEWS ===
export function useInterviews(filters?: { application_id?: string; interviewer_id?: string; date?: string }) {
  const params = new URLSearchParams();
  if (filters?.application_id) params.set("application_id", filters.application_id);
  if (filters?.interviewer_id) params.set("interviewer_id", filters.interviewer_id);
  if (filters?.date) params.set("date", filters.date);
  const query = params.toString() ? `?${params.toString()}` : "";

  return useQuery<InterviewSchedule[]>({
    queryKey: ["recruitment", "interviews", filters],
    queryFn: () => apiRequest(`/interviews${query}`),
  });
}

export function useMyInterviews() {
  return useQuery<InterviewSchedule[]>({
    queryKey: ["recruitment", "interviews", "my"],
    queryFn: () => apiRequest("/interviews/my"),
  });
}

export function useInterview(id: string) {
  return useQuery<InterviewSchedule>({
    queryKey: ["recruitment", "interviews", id],
    queryFn: () => apiRequest(`/interviews/${id}`),
    enabled: !!id,
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInterviewInput) =>
      apiRequest<InterviewSchedule>("/interviews", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      toast.success("Interview scheduled successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewSchedule> }) =>
      apiRequest<InterviewSchedule>(`/interviews/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews", id] });
      toast.success("Interview updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/interviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "stats"] });
      toast.success("Interview cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitInterviewFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitFeedbackInput }) =>
      apiRequest<InterviewSchedule>(`/interviews/${id}/feedback`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews", id] });
      toast.success("Feedback submitted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
