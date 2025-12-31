import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
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

// === STATS ===
export function useRecruitmentStats() {
  return useQuery<RecruitmentStats>({
    queryKey: ["recruitment", "stats"],
    queryFn: () => api.get("/recruitment/stats"),
  });
}

export function usePipelineStats() {
  return useQuery<PipelineStats>({
    queryKey: ["recruitment", "pipeline"],
    queryFn: () => api.get("/recruitment/pipeline"),
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
    queryFn: () => api.get(`/recruitment/jobs${query}`),
  });
}

export function useJobOpening(id: string) {
  return useQuery<JobOpening>({
    queryKey: ["recruitment", "jobs", id],
    queryFn: () => api.get(`/recruitment/jobs/${id}`),
    enabled: !!id,
  });
}

export function useCreateJobOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJobOpeningInput) =>
      api.post<JobOpening>("/recruitment/jobs", input),
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
      api.put<JobOpening>(`/recruitment/jobs/${id}`, data),
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
    mutationFn: (id: string) => api.delete(`/recruitment/jobs/${id}`),
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
      api.patch<JobOpening>(`/recruitment/jobs/${id}/status`, { status }),
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
    queryFn: () => api.get(`/recruitment/applications${query}`),
  });
}

export function useApplication(id: string) {
  return useQuery<JobApplication>({
    queryKey: ["recruitment", "applications", id],
    queryFn: () => api.get(`/recruitment/applications/${id}`),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      api.post<JobApplication>("/recruitment/applications", input),
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
      api.put<JobApplication>(`/recruitment/applications/${id}`, data),
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
      api.patch<JobApplication>(`/recruitment/applications/${id}/stage`, { stage, notes }),
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
      api.patch<JobApplication>(`/recruitment/applications/${id}/reject`, { reason, notes }),
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
      api.post(`/recruitment/applications/${applicationId}/convert`, data),
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
    queryFn: () => api.get(`/recruitment/interviews${query}`),
  });
}

export function useMyInterviews() {
  return useQuery<InterviewSchedule[]>({
    queryKey: ["recruitment", "interviews", "my"],
    queryFn: () => api.get("/recruitment/interviews/my"),
  });
}

export function useInterview(id: string) {
  return useQuery<InterviewSchedule>({
    queryKey: ["recruitment", "interviews", id],
    queryFn: () => api.get(`/recruitment/interviews/${id}`),
    enabled: !!id,
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInterviewInput) =>
      api.post<InterviewSchedule>("/recruitment/interviews", input),
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
      api.put<InterviewSchedule>(`/recruitment/interviews/${id}`, data),
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
    mutationFn: (id: string) => api.delete(`/recruitment/interviews/${id}`),
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
      api.patch<InterviewSchedule>(`/recruitment/interviews/${id}/feedback`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews", id] });
      toast.success("Feedback submitted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}