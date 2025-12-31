
-- =====================================================
-- PHASE 3 PART 2: REMAINING RLS POLICIES
-- =====================================================

-- ========== DOCUMENTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Employees can view their own documents" ON public.documents;

CREATE POLICY "Super admins can manage all documents"
ON public.documents FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage documents"
ON public.documents FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view documents in their company"
ON public.documents FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== LETTER TEMPLATES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage letter templates" ON public.letter_templates;
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON public.letter_templates;

CREATE POLICY "Super admins can manage all letter templates"
ON public.letter_templates FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage letter templates"
ON public.letter_templates FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view letter templates in their company"
ON public.letter_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== GENERATED LETTERS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all letters" ON public.generated_letters;
DROP POLICY IF EXISTS "Employees can view their own letters" ON public.generated_letters;

CREATE POLICY "Super admins can manage all generated letters"
ON public.generated_letters FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage generated letters"
ON public.generated_letters FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view generated letters in their company"
ON public.generated_letters FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EMAIL TEMPLATES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can view active email templates" ON public.email_templates;

CREATE POLICY "Super admins can manage all email templates"
ON public.email_templates FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage email templates"
ON public.email_templates FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view email templates in their company"
ON public.email_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ANNOUNCEMENTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.announcements;

CREATE POLICY "Super admins can manage all announcements"
ON public.announcements FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage announcements"
ON public.announcements FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view announcements in their company"
ON public.announcements FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ANNOUNCEMENT TEMPLATES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage announcement templates" ON public.announcement_templates;
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON public.announcement_templates;

CREATE POLICY "Super admins can manage all announcement templates"
ON public.announcement_templates FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage announcement templates"
ON public.announcement_templates FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view announcement templates in their company"
ON public.announcement_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ANNOUNCEMENT BANNER TEMPLATES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage banner templates" ON public.announcement_banner_templates;
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON public.announcement_banner_templates;

CREATE POLICY "Super admins can manage all banner templates"
ON public.announcement_banner_templates FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage banner templates"
ON public.announcement_banner_templates FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view banner templates in their company"
ON public.announcement_banner_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== HELPDESK TICKETS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Employees can create tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Employees can view their own tickets" ON public.helpdesk_tickets;

CREATE POLICY "Super admins can manage all helpdesk tickets"
ON public.helpdesk_tickets FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage helpdesk tickets"
ON public.helpdesk_tickets FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can create helpdesk tickets in their company"
ON public.helpdesk_tickets FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view helpdesk tickets in their company"
ON public.helpdesk_tickets FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== TICKET MESSAGES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can add messages to their tickets" ON public.ticket_messages;

CREATE POLICY "Super admins can manage all ticket messages"
ON public.ticket_messages FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage ticket messages"
ON public.ticket_messages FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can manage ticket messages in their company"
ON public.ticket_messages FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EXPENSE CATEGORIES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view active categories" ON public.expense_categories;

CREATE POLICY "Super admins can manage all expense categories"
ON public.expense_categories FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage expense categories"
ON public.expense_categories FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view expense categories in their company"
ON public.expense_categories FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EXPENSE CLAIMS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all expense claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Employees can create their own expense claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Employees can delete their own pending claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Employees can update their own pending claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Employees can view their own expense claims" ON public.expense_claims;

CREATE POLICY "Super admins can manage all expense claims"
ON public.expense_claims FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage expense claims"
ON public.expense_claims FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can create expense claims in their company"
ON public.expense_claims FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view expense claims in their company"
ON public.expense_claims FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update expense claims in their company"
ON public.expense_claims FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete expense claims in their company"
ON public.expense_claims FOR DELETE
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EXPENSE POLICIES TABLE ==========
DROP POLICY IF EXISTS "Admin can manage expense policies" ON public.expense_policies;
DROP POLICY IF EXISTS "Authenticated users can view active policies" ON public.expense_policies;

CREATE POLICY "Super admins can manage all expense policies"
ON public.expense_policies FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage expense policies"
ON public.expense_policies FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view expense policies in their company"
ON public.expense_policies FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== JOB OPENINGS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage job openings" ON public.job_openings;
DROP POLICY IF EXISTS "Public can view active job openings" ON public.job_openings;

CREATE POLICY "Super admins can manage all job openings"
ON public.job_openings FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage job openings"
ON public.job_openings FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view job openings in their company"
ON public.job_openings FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Public can view active job openings"
ON public.job_openings FOR SELECT
USING (status = 'open');

-- ========== JOB APPLICATIONS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public can submit applications" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.job_applications;

CREATE POLICY "Super admins can manage all job applications"
ON public.job_applications FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage job applications"
ON public.job_applications FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view job applications in their company"
ON public.job_applications FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Public can submit job applications"
ON public.job_applications FOR INSERT
WITH CHECK (true);

-- ========== INTERVIEW SCHEDULES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage interview schedules" ON public.interview_schedules;
DROP POLICY IF EXISTS "Interviewers can view their interviews" ON public.interview_schedules;

CREATE POLICY "Super admins can manage all interview schedules"
ON public.interview_schedules FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage interview schedules"
ON public.interview_schedules FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view interview schedules in their company"
ON public.interview_schedules FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== INTERVIEW FEEDBACK TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage interview feedback" ON public.interview_feedback;
DROP POLICY IF EXISTS "Interviewers can add feedback" ON public.interview_feedback;

CREATE POLICY "Super admins can manage all interview feedback"
ON public.interview_feedback FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage interview feedback"
ON public.interview_feedback FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can manage interview feedback in their company"
ON public.interview_feedback FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- ========== APPLICATION STAGE HISTORY TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage stage history" ON public.application_stage_history;
DROP POLICY IF EXISTS "Interviewers can view stage history" ON public.application_stage_history;

CREATE POLICY "Super admins can manage all stage history"
ON public.application_stage_history FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage stage history"
ON public.application_stage_history FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view stage history in their company"
ON public.application_stage_history FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ONBOARDING PROCESSES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage onboarding" ON public.onboarding_processes;
DROP POLICY IF EXISTS "Employees can view their onboarding" ON public.onboarding_processes;

CREATE POLICY "Super admins can manage all onboarding processes"
ON public.onboarding_processes FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage onboarding processes"
ON public.onboarding_processes FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view onboarding processes in their company"
ON public.onboarding_processes FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ONBOARDING TASKS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Employees can view and update their tasks" ON public.onboarding_tasks;

CREATE POLICY "Super admins can manage all onboarding tasks"
ON public.onboarding_tasks FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage onboarding tasks"
ON public.onboarding_tasks FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can manage onboarding tasks in their company"
ON public.onboarding_tasks FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ONBOARDING TEMPLATES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage onboarding templates" ON public.onboarding_templates;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.onboarding_templates;

CREATE POLICY "Super admins can manage all onboarding templates"
ON public.onboarding_templates FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage onboarding templates"
ON public.onboarding_templates FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view onboarding templates in their company"
ON public.onboarding_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== OFFBOARDING PROCESSES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage offboarding" ON public.offboarding_processes;
DROP POLICY IF EXISTS "Employees can view their offboarding" ON public.offboarding_processes;

CREATE POLICY "Super admins can manage all offboarding processes"
ON public.offboarding_processes FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage offboarding processes"
ON public.offboarding_processes FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view offboarding processes in their company"
ON public.offboarding_processes FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== OFFBOARDING TASKS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage offboarding tasks" ON public.offboarding_tasks;
DROP POLICY IF EXISTS "Employees can view and update their tasks" ON public.offboarding_tasks;

CREATE POLICY "Super admins can manage all offboarding tasks"
ON public.offboarding_tasks FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage offboarding tasks"
ON public.offboarding_tasks FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can manage offboarding tasks in their company"
ON public.offboarding_tasks FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EXIT INTERVIEWS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all exit interviews" ON public.exit_interviews;
DROP POLICY IF EXISTS "Employees can view their own exit interview" ON public.exit_interviews;

CREATE POLICY "Super admins can manage all exit interviews"
ON public.exit_interviews FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage exit interviews"
ON public.exit_interviews FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view exit interviews in their company"
ON public.exit_interviews FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== FNF SETTLEMENTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all FnF settlements" ON public.fnf_settlements;
DROP POLICY IF EXISTS "Employees can view their own FnF settlement" ON public.fnf_settlements;

CREATE POLICY "Super admins can manage all fnf settlements"
ON public.fnf_settlements FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage fnf settlements"
ON public.fnf_settlements FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view fnf settlements in their company"
ON public.fnf_settlements FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== STORES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can view stores" ON public.stores;
DROP POLICY IF EXISTS "Store managers can view their stores" ON public.stores;

CREATE POLICY "Super admins can manage all stores"
ON public.stores FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage stores"
ON public.stores FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view stores in their company"
ON public.stores FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EMPLOYEE STORE ASSIGNMENTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage store assignments" ON public.employee_store_assignments;
DROP POLICY IF EXISTS "Employees can view their own store assignments" ON public.employee_store_assignments;
DROP POLICY IF EXISTS "Store managers can view their store assignments" ON public.employee_store_assignments;

CREATE POLICY "Super admins can manage all store assignments"
ON public.employee_store_assignments FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage store assignments"
ON public.employee_store_assignments FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view store assignments in their company"
ON public.employee_store_assignments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== EMPLOYEE TRANSFERS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all transfers" ON public.employee_transfers;
DROP POLICY IF EXISTS "Employees can view their own transfers" ON public.employee_transfers;
DROP POLICY IF EXISTS "Store managers can view transfers for their stores" ON public.employee_transfers;

CREATE POLICY "Super admins can manage all employee transfers"
ON public.employee_transfers FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage employee transfers"
ON public.employee_transfers FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view employee transfers in their company"
ON public.employee_transfers FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));
