-- Create job_openings table
CREATE TABLE public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
  employment_type TEXT NOT NULL DEFAULT 'full-time',
  location TEXT,
  remote_policy TEXT DEFAULT 'onsite',
  openings_count INTEGER NOT NULL DEFAULT 1,
  salary_min NUMERIC,
  salary_max NUMERIC,
  show_salary BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  posted_date DATE,
  closing_date DATE,
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_opening_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  current_company TEXT,
  current_designation TEXT,
  experience_years NUMERIC,
  expected_salary NUMERIC,
  notice_period_days INTEGER,
  source TEXT DEFAULT 'website',
  referred_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  current_stage TEXT NOT NULL DEFAULT 'screening',
  status TEXT NOT NULL DEFAULT 'active',
  rejection_reason TEXT,
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_stage_history table
CREATE TABLE public.application_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interview_schedules table
CREATE TABLE public.interview_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'phone',
  interview_round INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  interviewer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  location_or_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interview_feedback table
CREATE TABLE public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  criteria TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_openings
CREATE POLICY "Admin and HR can manage job openings"
ON public.job_openings FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Authenticated users can view open jobs"
ON public.job_openings FOR SELECT
USING (status = 'open');

-- RLS Policies for job_applications
CREATE POLICY "Admin and HR can manage all applications"
ON public.job_applications FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Interviewers can view assigned applications"
ON public.job_applications FOR SELECT
USING (
  id IN (
    SELECT application_id FROM public.interview_schedules
    WHERE interviewer_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for application_stage_history
CREATE POLICY "Admin and HR can manage stage history"
ON public.application_stage_history FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Interviewers can view stage history"
ON public.application_stage_history FOR SELECT
USING (
  application_id IN (
    SELECT application_id FROM public.interview_schedules
    WHERE interviewer_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for interview_schedules
CREATE POLICY "Admin and HR can manage all interviews"
ON public.interview_schedules FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Interviewers can view their assigned interviews"
ON public.interview_schedules FOR SELECT
USING (
  interviewer_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Interviewers can update their interview feedback"
ON public.interview_schedules FOR UPDATE
USING (
  interviewer_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- RLS Policies for interview_feedback
CREATE POLICY "Admin and HR can manage all feedback"
ON public.interview_feedback FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "Interviewers can view feedback for their interviews"
ON public.interview_feedback FOR SELECT
USING (
  interview_id IN (
    SELECT id FROM public.interview_schedules
    WHERE interviewer_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Interviewers can add feedback to their interviews"
ON public.interview_feedback FOR INSERT
WITH CHECK (
  interview_id IN (
    SELECT id FROM public.interview_schedules
    WHERE interviewer_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_job_openings_updated_at
BEFORE UPDATE ON public.job_openings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_schedules_updated_at
BEFORE UPDATE ON public.interview_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();