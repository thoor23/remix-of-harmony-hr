export type JobOpeningStatus = 'draft' | 'open' | 'on-hold' | 'closed' | 'filled';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export type RemotePolicy = 'onsite' | 'remote' | 'hybrid';
export type ApplicationStage = 'screening' | 'phone-interview' | 'technical' | 'hr-interview' | 'offer' | 'hired' | 'rejected';
export type ApplicationStatus = 'active' | 'on-hold' | 'rejected' | 'withdrawn' | 'hired';
export type InterviewType = 'phone' | 'video' | 'technical' | 'hr' | 'panel' | 'final';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
export type InterviewRecommendation = 'proceed' | 'reject' | 'on-hold';
export type ApplicationSource = 'job-portal' | 'referral' | 'website' | 'linkedin' | 'other';

export interface JobOpening {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  department_id?: string;
  designation_id?: string;
  employment_type: EmploymentType;
  location?: string;
  remote_policy: RemotePolicy;
  openings_count: number;
  salary_min?: number;
  salary_max?: number;
  show_salary: boolean;
  status: JobOpeningStatus;
  posted_date?: string;
  closing_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  department?: { id: string; name: string };
  designation?: { id: string; name: string };
  created_by_employee?: { id: string; first_name: string; last_name: string };
  applications?: JobApplication[] | { count: number }[];
}

export interface JobApplication {
  id: string;
  job_opening_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  resume_url?: string;
  cover_letter?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  current_company?: string;
  current_designation?: string;
  experience_years?: number;
  expected_salary?: number;
  notice_period_days?: number;
  source: ApplicationSource;
  referred_by?: string;
  current_stage: ApplicationStage;
  status: ApplicationStatus;
  rejection_reason?: string;
  notes?: string;
  applied_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  job?: JobOpening;
  referred_by_employee?: { id: string; first_name: string; last_name: string };
  stage_history?: ApplicationStageHistory[];
  interviews?: InterviewSchedule[];
}

export interface ApplicationStageHistory {
  id: string;
  application_id: string;
  from_stage?: string;
  to_stage: string;
  notes?: string;
  updated_by?: string;
  created_at: string;
  // Joined data
  updated_by_employee?: { id: string; first_name: string; last_name: string };
}

export interface InterviewSchedule {
  id: string;
  application_id: string;
  interview_type: InterviewType;
  interview_round: number;
  scheduled_at: string;
  duration_minutes: number;
  interviewer_id?: string;
  location_or_link?: string;
  status: InterviewStatus;
  feedback?: string;
  rating?: number;
  recommendation?: InterviewRecommendation;
  created_at: string;
  updated_at: string;
  // Joined data
  application?: JobApplication;
  interviewer?: { id: string; first_name: string; last_name: string };
  detailed_feedback?: InterviewFeedback[];
}

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  interviewer_id?: string;
  criteria: string;
  rating: number;
  comments?: string;
  created_at: string;
  // Joined data
  interviewer?: { id: string; first_name: string; last_name: string };
}

export interface RecruitmentStats {
  open_positions: number;
  total_applications: number;
  interviews_today: number;
  pending_offers: number;
}

export interface PipelineStats {
  screening: number;
  'phone-interview': number;
  technical: number;
  'hr-interview': number;
  offer: number;
  hired: number;
}

export interface CreateJobOpeningInput {
  title: string;
  description?: string;
  requirements?: string;
  department_id?: string;
  designation_id?: string;
  employment_type?: EmploymentType;
  location?: string;
  remote_policy?: RemotePolicy;
  openings_count?: number;
  salary_min?: number;
  salary_max?: number;
  show_salary?: boolean;
  closing_date?: string;
  created_by?: string;
}

export interface CreateApplicationInput {
  job_opening_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  resume_url?: string;
  cover_letter?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  current_company?: string;
  current_designation?: string;
  experience_years?: number;
  expected_salary?: number;
  notice_period_days?: number;
  source?: ApplicationSource;
  referred_by?: string;
}

export interface ScheduleInterviewInput {
  application_id: string;
  interview_type: InterviewType;
  interview_round?: number;
  scheduled_at: string;
  duration_minutes?: number;
  interviewer_id?: string;
  location_or_link?: string;
}

export interface SubmitFeedbackInput {
  feedback?: string;
  rating?: number;
  recommendation?: InterviewRecommendation;
  detailed_feedback?: {
    criteria: string;
    rating: number;
    comments?: string;
  }[];
}

export interface ConvertToEmployeeInput {
  employee_id: string;
  date_of_joining?: string;
  employment_type?: EmploymentType;
}
