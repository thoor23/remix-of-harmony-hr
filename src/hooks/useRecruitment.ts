import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCompanyId, getEmployeeId } from "@/lib/supabase-helpers";
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
  return useQuery({
    queryKey: ["recruitment", "stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const [{ data: jobs }, { data: apps }, { data: interviews }] = await Promise.all([
        supabase.from('job_openings').select('status').eq('company_id', companyId),
        supabase.from('job_applications').select('current_stage, status').eq('company_id', companyId),
        supabase.from('interview_schedules').select('status').eq('company_id', companyId),
      ]);

      return {
        open_positions: jobs?.filter(j => j.status === 'open').length || 0,
        total_applications: apps?.length || 0,
        interviews_today: interviews?.filter(i => i.status === 'scheduled').length || 0,
        pending_offers: apps?.filter(a => a.current_stage === 'offer').length || 0,
        hires_this_month: apps?.filter(a => a.status === 'hired').length || 0,
      } as RecruitmentStats;
    },
  });
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ["recruitment", "pipeline"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data: apps } = await supabase
        .from('job_applications')
        .select('current_stage')
        .eq('company_id', companyId)
        .eq('status', 'active');

      return {
        new: apps?.filter(a => a.current_stage === 'new').length || 0,
        screening: apps?.filter(a => a.current_stage === 'screening').length || 0,
        'phone-interview': apps?.filter(a => a.current_stage === 'phone-interview').length || 0,
        technical: apps?.filter(a => a.current_stage === 'technical').length || 0,
        'hr-interview': apps?.filter(a => a.current_stage === 'hr-interview').length || 0,
        interview: apps?.filter(a => a.current_stage === 'interview').length || 0,
        offer: apps?.filter(a => a.current_stage === 'offer').length || 0,
        hired: apps?.filter(a => a.current_stage === 'hired').length || 0,
      } as PipelineStats;
    },
  });
}

// === JOB OPENINGS ===
export function useJobOpenings(filters?: { status?: string; department_id?: string }) {
  return useQuery({
    queryKey: ["recruitment", "jobs", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('job_openings')
        .select(`
          *,
          department:departments(id, name),
          designation:designations(id, name)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.department_id) {
        query = query.eq('department_id', filters.department_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as JobOpening[];
    },
  });
}

export function useJobOpening(id: string) {
  return useQuery({
    queryKey: ["recruitment", "jobs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_openings')
        .select(`
          *,
          department:departments(id, name),
          designation:designations(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as JobOpening;
    },
    enabled: !!id,
  });
}

export function useCreateJobOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateJobOpeningInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('job_openings')
        .insert([{
          ...input,
          company_id: companyId,
          created_by: employeeId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as JobOpening;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobOpening> }) => {
      const { data: result, error } = await supabase
        .from('job_openings')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as JobOpening;
    },
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_openings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('job_openings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JobOpening;
    },
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
  return useQuery({
    queryKey: ["recruitment", "applications", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job:job_openings(id, title, department:departments(name))
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.job_id) {
        query = query.eq('job_opening_id', filters.job_id);
      }
      if (filters?.stage) {
        query = query.eq('current_stage', filters.stage);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as JobApplication[];
    },
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["recruitment", "applications", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_openings(id, title, department:departments(name)),
          stage_history:application_stage_history(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as JobApplication;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          ...input,
          company_id: companyId,
          current_stage: 'new',
          status: 'active',
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as JobApplication;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobApplication> }) => {
      const { data: result, error } = await supabase
        .from('job_applications')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as unknown as JobApplication;
    },
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
    mutationFn: async ({ id, stage, notes }: { id: string; stage: ApplicationStage; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      // Get current stage
      const { data: current } = await supabase
        .from('job_applications')
        .select('current_stage')
        .eq('id', id)
        .single();

      // Update application stage
      const { data: result, error } = await supabase
        .from('job_applications')
        .update({ current_stage: stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add stage history
      await supabase
        .from('application_stage_history')
        .insert([{
          application_id: id,
          company_id: companyId,
          from_stage: current?.current_stage,
          to_stage: stage,
          notes,
          updated_by: employeeId,
        }]);

      return result as unknown as JobApplication;
    },
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
    mutationFn: async ({ id, reason, notes }: { id: string; reason: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status: 'rejected', rejection_reason: reason } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as JobApplication;
    },
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
    mutationFn: async ({ applicationId, data }: { applicationId: string; data: ConvertToEmployeeInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      // Get application details
      const { data: app } = await supabase
        .from('job_applications')
        .select('candidate_name, candidate_email, candidate_phone')
        .eq('id', applicationId)
        .single();

      if (!app) throw new Error('Application not found');

      // Parse name
      const nameParts = (app.candidate_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert([{
          ...data,
          first_name: firstName,
          last_name: lastName,
          email: app.candidate_email,
          phone: app.candidate_phone,
          company_id: companyId,
          status: 'active',
        } as any])
        .select()
        .single();

      if (empError) throw empError;

      // Update application status
      await supabase
        .from('job_applications')
        .update({ status: 'hired', current_stage: 'hired' })
        .eq('id', applicationId);

      return employee;
    },
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
  return useQuery({
    queryKey: ["recruitment", "interviews", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      if (!companyId) throw new Error('Company not found');

      let query = supabase
        .from('interview_schedules')
        .select(`
          *,
          application:job_applications(id, candidate_name, job:job_openings(title)),
          interviewer:employees(id, first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('scheduled_at', { ascending: true });

      if (filters?.application_id) {
        query = query.eq('application_id', filters.application_id);
      }
      if (filters?.interviewer_id) {
        query = query.eq('interviewer_id', filters.interviewer_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as InterviewSchedule[];
    },
  });
}

export function useMyInterviews() {
  return useQuery({
    queryKey: ["recruitment", "interviews", "my"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const employeeId = await getEmployeeId(user.id);
      if (!employeeId) throw new Error('Employee not found');

      const { data, error } = await supabase
        .from('interview_schedules')
        .select(`
          *,
          application:job_applications(id, candidate_name, job:job_openings(title))
        `)
        .eq('interviewer_id', employeeId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as InterviewSchedule[];
    },
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ["recruitment", "interviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_schedules')
        .select(`
          *,
          application:job_applications(id, candidate_name, job:job_openings(title)),
          interviewer:employees(id, first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as InterviewSchedule;
    },
    enabled: !!id,
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScheduleInterviewInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const companyId = await getCompanyId(user.id);
      const employeeId = await getEmployeeId(user.id);
      if (!companyId) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('interview_schedules')
        .insert([{
          ...input,
          company_id: companyId,
          created_by: employeeId,
          status: 'scheduled',
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as InterviewSchedule;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<InterviewSchedule> }) => {
      const { data: result, error } = await supabase
        .from('interview_schedules')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as unknown as InterviewSchedule;
    },
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('interview_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: SubmitFeedbackInput }) => {
      const { data: result, error } = await supabase
        .from('interview_schedules')
        .update({
          feedback: data.feedback,
          rating: data.rating,
          recommendation: data.recommendation,
          status: 'completed',
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as unknown as InterviewSchedule;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews", id] });
      toast.success("Feedback submitted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
