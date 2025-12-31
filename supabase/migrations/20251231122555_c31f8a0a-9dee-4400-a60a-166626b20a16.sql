
-- =====================================================
-- PHASE 1 & 2: MULTI-COMPANY (MULTI-TENANT) CONVERSION
-- =====================================================

-- 1. Create companies table (Master tenant table)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  website TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,
  max_employees INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create super_admins table (Platform owners)
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create default company for existing data migration
INSERT INTO public.companies (id, name, code, email, subscription_plan, subscription_status, max_employees, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Company',
  'DEFAULT',
  'admin@hrms.local',
  'enterprise',
  'active',
  10000,
  true
);

-- 4. Add company_id to all existing tables (only tables that exist)
-- Core HR Tables
ALTER TABLE public.employees ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.departments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.designations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Attendance Tables
ALTER TABLE public.attendance_records ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_regularization_requests ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Shift Tables
ALTER TABLE public.shifts ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.shift_assignments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.shift_exchange_requests ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.shift_rotations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Leave Tables
ALTER TABLE public.leave_types ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.leave_balances ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.leave_requests ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Payroll Tables
ALTER TABLE public.salary_structures ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.payslips ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.payslip_templates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Asset Tables
ALTER TABLE public.assets ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.asset_categories ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.asset_assignments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.asset_maintenance ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.asset_maintenance_requests ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.asset_transfers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Document Tables
ALTER TABLE public.documents ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.letter_templates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.generated_letters ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.email_templates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Announcement Tables
ALTER TABLE public.announcements ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.announcement_templates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.announcement_banner_templates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Helpdesk Tables
ALTER TABLE public.helpdesk_tickets ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_messages ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Expense Tables
ALTER TABLE public.expense_categories ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.expense_claims ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.expense_policies ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Recruitment Tables
ALTER TABLE public.job_openings ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.interview_schedules ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.interview_feedback ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.application_stage_history ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Onboarding Tables
ALTER TABLE public.onboarding_processes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_tasks ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_templates ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Offboarding Tables
ALTER TABLE public.offboarding_processes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.offboarding_tasks ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.exit_interviews ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.fnf_settlements ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Location Tables
ALTER TABLE public.stores ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.employee_store_assignments ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.employee_transfers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Invoice Tables
ALTER TABLE public.internal_invoices ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.internal_invoice_items ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.internal_invoice_categories ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Notification Tables
ALTER TABLE public.notifications ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.targeted_notifications ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- System Tables
ALTER TABLE public.holidays ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.system_settings ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.roles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Status Tables (corrected table names)
ALTER TABLE public.status_history ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.status_incidents ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.status_subscribers ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.status_subscriptions ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Profile Tables
ALTER TABLE public.profile_change_requests ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Auth Tables
ALTER TABLE public.users ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.refresh_tokens ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Audit Logs (optional company_id for super admin actions)
ALTER TABLE public.audit_logs ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- 5. Migrate all existing data to default company
UPDATE public.employees SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.departments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.designations SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.attendance_records SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.attendance_regularization_requests SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.shifts SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.shift_assignments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.shift_exchange_requests SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.shift_rotations SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.leave_types SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.leave_balances SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.leave_requests SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.salary_structures SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.payslips SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.payslip_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.assets SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.asset_categories SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.asset_assignments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.asset_maintenance SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.asset_maintenance_requests SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.asset_transfers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.documents SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.letter_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.generated_letters SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.email_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.announcements SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.announcement_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.announcement_banner_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.helpdesk_tickets SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.ticket_messages SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.expense_categories SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.expense_claims SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.expense_policies SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.job_openings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.job_applications SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.interview_schedules SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.interview_feedback SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.application_stage_history SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.onboarding_processes SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.onboarding_tasks SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.onboarding_templates SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.offboarding_processes SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.offboarding_tasks SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.exit_interviews SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.fnf_settlements SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.stores SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.employee_store_assignments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.employee_transfers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.internal_invoices SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.internal_invoice_items SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.internal_invoice_categories SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.notifications SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.targeted_notifications SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.holidays SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.system_settings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.roles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.user_roles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.status_history SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.status_incidents SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.status_subscribers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.status_subscriptions SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.profile_change_requests SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.users SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.refresh_tokens SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.audit_logs SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

-- 6. Make company_id NOT NULL after migration (except audit_logs)
ALTER TABLE public.employees ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.designations ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.attendance_records ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.attendance_regularization_requests ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shifts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_assignments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_exchange_requests ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shift_rotations ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.leave_types ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.leave_balances ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.leave_requests ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.salary_structures ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.payslips ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.payslip_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.assets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.asset_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.asset_assignments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.asset_maintenance ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.asset_maintenance_requests ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.asset_transfers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.letter_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.generated_letters ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.email_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.announcements ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.announcement_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.announcement_banner_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.helpdesk_tickets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.ticket_messages ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.expense_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.expense_claims ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.expense_policies ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.job_openings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.job_applications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.interview_schedules ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.interview_feedback ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.application_stage_history ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.onboarding_processes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.onboarding_tasks ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.onboarding_templates ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.offboarding_processes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.offboarding_tasks ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.exit_interviews ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.fnf_settlements ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.stores ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.employee_store_assignments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.employee_transfers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.internal_invoices ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.internal_invoice_items ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.internal_invoice_categories ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.targeted_notifications ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.holidays ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.system_settings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.roles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.status_history ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.status_incidents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.status_subscribers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.status_subscriptions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.profile_change_requests ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.refresh_tokens ALTER COLUMN company_id SET NOT NULL;

-- 7. Create indexes for company_id on all tables for performance
CREATE INDEX idx_employees_company_id ON public.employees(company_id);
CREATE INDEX idx_departments_company_id ON public.departments(company_id);
CREATE INDEX idx_designations_company_id ON public.designations(company_id);
CREATE INDEX idx_attendance_records_company_id ON public.attendance_records(company_id);
CREATE INDEX idx_attendance_regularization_requests_company_id ON public.attendance_regularization_requests(company_id);
CREATE INDEX idx_shifts_company_id ON public.shifts(company_id);
CREATE INDEX idx_shift_assignments_company_id ON public.shift_assignments(company_id);
CREATE INDEX idx_shift_exchange_requests_company_id ON public.shift_exchange_requests(company_id);
CREATE INDEX idx_shift_rotations_company_id ON public.shift_rotations(company_id);
CREATE INDEX idx_leave_types_company_id ON public.leave_types(company_id);
CREATE INDEX idx_leave_balances_company_id ON public.leave_balances(company_id);
CREATE INDEX idx_leave_requests_company_id ON public.leave_requests(company_id);
CREATE INDEX idx_salary_structures_company_id ON public.salary_structures(company_id);
CREATE INDEX idx_payslips_company_id ON public.payslips(company_id);
CREATE INDEX idx_payslip_templates_company_id ON public.payslip_templates(company_id);
CREATE INDEX idx_assets_company_id ON public.assets(company_id);
CREATE INDEX idx_asset_categories_company_id ON public.asset_categories(company_id);
CREATE INDEX idx_asset_assignments_company_id ON public.asset_assignments(company_id);
CREATE INDEX idx_asset_maintenance_company_id ON public.asset_maintenance(company_id);
CREATE INDEX idx_asset_maintenance_requests_company_id ON public.asset_maintenance_requests(company_id);
CREATE INDEX idx_asset_transfers_company_id ON public.asset_transfers(company_id);
CREATE INDEX idx_documents_company_id ON public.documents(company_id);
CREATE INDEX idx_letter_templates_company_id ON public.letter_templates(company_id);
CREATE INDEX idx_generated_letters_company_id ON public.generated_letters(company_id);
CREATE INDEX idx_email_templates_company_id ON public.email_templates(company_id);
CREATE INDEX idx_announcements_company_id ON public.announcements(company_id);
CREATE INDEX idx_announcement_templates_company_id ON public.announcement_templates(company_id);
CREATE INDEX idx_announcement_banner_templates_company_id ON public.announcement_banner_templates(company_id);
CREATE INDEX idx_helpdesk_tickets_company_id ON public.helpdesk_tickets(company_id);
CREATE INDEX idx_ticket_messages_company_id ON public.ticket_messages(company_id);
CREATE INDEX idx_expense_categories_company_id ON public.expense_categories(company_id);
CREATE INDEX idx_expense_claims_company_id ON public.expense_claims(company_id);
CREATE INDEX idx_expense_policies_company_id ON public.expense_policies(company_id);
CREATE INDEX idx_job_openings_company_id ON public.job_openings(company_id);
CREATE INDEX idx_job_applications_company_id ON public.job_applications(company_id);
CREATE INDEX idx_interview_schedules_company_id ON public.interview_schedules(company_id);
CREATE INDEX idx_interview_feedback_company_id ON public.interview_feedback(company_id);
CREATE INDEX idx_application_stage_history_company_id ON public.application_stage_history(company_id);
CREATE INDEX idx_onboarding_processes_company_id ON public.onboarding_processes(company_id);
CREATE INDEX idx_onboarding_tasks_company_id ON public.onboarding_tasks(company_id);
CREATE INDEX idx_onboarding_templates_company_id ON public.onboarding_templates(company_id);
CREATE INDEX idx_offboarding_processes_company_id ON public.offboarding_processes(company_id);
CREATE INDEX idx_offboarding_tasks_company_id ON public.offboarding_tasks(company_id);
CREATE INDEX idx_exit_interviews_company_id ON public.exit_interviews(company_id);
CREATE INDEX idx_fnf_settlements_company_id ON public.fnf_settlements(company_id);
CREATE INDEX idx_stores_company_id ON public.stores(company_id);
CREATE INDEX idx_employee_store_assignments_company_id ON public.employee_store_assignments(company_id);
CREATE INDEX idx_employee_transfers_company_id ON public.employee_transfers(company_id);
CREATE INDEX idx_internal_invoices_company_id ON public.internal_invoices(company_id);
CREATE INDEX idx_internal_invoice_items_company_id ON public.internal_invoice_items(company_id);
CREATE INDEX idx_internal_invoice_categories_company_id ON public.internal_invoice_categories(company_id);
CREATE INDEX idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX idx_targeted_notifications_company_id ON public.targeted_notifications(company_id);
CREATE INDEX idx_holidays_company_id ON public.holidays(company_id);
CREATE INDEX idx_system_settings_company_id ON public.system_settings(company_id);
CREATE INDEX idx_roles_company_id ON public.roles(company_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX idx_status_history_company_id ON public.status_history(company_id);
CREATE INDEX idx_status_incidents_company_id ON public.status_incidents(company_id);
CREATE INDEX idx_status_subscribers_company_id ON public.status_subscribers(company_id);
CREATE INDEX idx_status_subscriptions_company_id ON public.status_subscriptions(company_id);
CREATE INDEX idx_profile_change_requests_company_id ON public.profile_change_requests(company_id);
CREATE INDEX idx_users_company_id ON public.users(company_id);
CREATE INDEX idx_refresh_tokens_company_id ON public.refresh_tokens(company_id);
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);

-- 8. Create updated_at trigger for companies table
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PHASE 2: HELPER FUNCTIONS FOR MULTI-TENANCY
-- =====================================================

-- 9. Function to check if user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = _user_id
  )
$$;

-- 10. Function to get user's company ID
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = _user_id
  LIMIT 1
$$;

-- 11. Function to check if user can access a specific company
CREATE OR REPLACE FUNCTION public.can_access_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_super_admin(_user_id) 
    OR get_user_company_id(_user_id) = _company_id
$$;

-- 12. Function to get company details for a user
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  code TEXT,
  logo_url TEXT,
  settings JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.code, c.logo_url, c.settings
  FROM public.companies c
  WHERE c.id = get_user_company_id(_user_id)
  LIMIT 1
$$;

-- =====================================================
-- PHASE 3: RLS POLICIES FOR COMPANIES AND SUPER_ADMINS
-- =====================================================

-- 13. Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 14. RLS policies for companies table
CREATE POLICY "Super admins can manage all companies"
ON public.companies FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT
USING (id = get_user_company_id(auth.uid()));

-- 15. RLS policies for super_admins table
CREATE POLICY "Super admins can view super_admins"
ON public.super_admins FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can manage super_admins"
ON public.super_admins FOR ALL
USING (is_super_admin(auth.uid()));
