-- Fix RLS InitPlan Performance Warnings
-- Wrap auth.uid() in (SELECT ...) to prevent re-evaluation per row

-- =============================================
-- COMPANIES TABLE
-- =============================================
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Super admins can view all companies" ON public.companies
FOR SELECT USING (is_super_admin((SELECT auth.uid())));

CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT USING (id = get_user_company_id((SELECT auth.uid())));

-- =============================================
-- EMPLOYEES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;

CREATE POLICY "Users can view employees in their company" ON public.employees
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage employees" ON public.employees
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

CREATE POLICY "Users can view their own employee record" ON public.employees
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- =============================================
-- DEPARTMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;

CREATE POLICY "Users can view departments in their company" ON public.departments
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage departments" ON public.departments
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- DESIGNATIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view designations in their company" ON public.designations;
DROP POLICY IF EXISTS "Admins can manage designations" ON public.designations;

CREATE POLICY "Users can view designations in their company" ON public.designations
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage designations" ON public.designations
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- ATTENDANCE RECORDS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view attendance in their company" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance_records;

CREATE POLICY "Users can view attendance in their company" ON public.attendance_records
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Users can view their own attendance" ON public.attendance_records
FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can insert their own attendance" ON public.attendance_records
FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Admins can manage attendance" ON public.attendance_records
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view audit logs in their company" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can view audit logs in their company" ON public.audit_logs
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

-- =============================================
-- STORES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view stores in their company" ON public.stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON public.stores;

CREATE POLICY "Users can view stores in their company" ON public.stores
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage stores" ON public.stores
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- SHIFTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view shifts in their company" ON public.shifts;
DROP POLICY IF EXISTS "Admins can manage shifts" ON public.shifts;

CREATE POLICY "Users can view shifts in their company" ON public.shifts
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage shifts" ON public.shifts
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- SHIFT ASSIGNMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view shift assignments in their company" ON public.shift_assignments;
DROP POLICY IF EXISTS "Admins can manage shift assignments" ON public.shift_assignments;

CREATE POLICY "Users can view shift assignments in their company" ON public.shift_assignments
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage shift assignments" ON public.shift_assignments
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- LEAVE TYPES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view leave types in their company" ON public.leave_types;
DROP POLICY IF EXISTS "Admins can manage leave types" ON public.leave_types;

CREATE POLICY "Users can view leave types in their company" ON public.leave_types
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage leave types" ON public.leave_types
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- LEAVE REQUESTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view leave requests in their company" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can manage their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Admins can manage leave requests" ON public.leave_requests;

CREATE POLICY "Users can view leave requests in their company" ON public.leave_requests
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Users can manage their own leave requests" ON public.leave_requests
FOR ALL USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Admins can manage leave requests" ON public.leave_requests
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- LEAVE BALANCES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view leave balances in their company" ON public.leave_balances;
DROP POLICY IF EXISTS "Admins can manage leave balances" ON public.leave_balances;

CREATE POLICY "Users can view leave balances in their company" ON public.leave_balances
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage leave balances" ON public.leave_balances
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- HOLIDAYS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view holidays in their company" ON public.holidays;
DROP POLICY IF EXISTS "Admins can manage holidays" ON public.holidays;

CREATE POLICY "Users can view holidays in their company" ON public.holidays
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage holidays" ON public.holidays
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- ASSETS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view assets in their company" ON public.assets;
DROP POLICY IF EXISTS "Admins can manage assets" ON public.assets;

CREATE POLICY "Users can view assets in their company" ON public.assets
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage assets" ON public.assets
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- ASSET CATEGORIES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view asset categories in their company" ON public.asset_categories;
DROP POLICY IF EXISTS "Admins can manage asset categories" ON public.asset_categories;

CREATE POLICY "Users can view asset categories in their company" ON public.asset_categories
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage asset categories" ON public.asset_categories
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view documents in their company" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;

CREATE POLICY "Users can view documents in their company" ON public.documents
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage documents" ON public.documents
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view announcements in their company" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

CREATE POLICY "Users can view announcements in their company" ON public.announcements
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- HELPDESK TICKETS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view tickets in their company" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Admins can manage tickets" ON public.helpdesk_tickets;

CREATE POLICY "Users can view tickets in their company" ON public.helpdesk_tickets
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Users can manage their own tickets" ON public.helpdesk_tickets
FOR ALL USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Admins can manage tickets" ON public.helpdesk_tickets
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- EXPENSE CLAIMS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view expenses in their company" ON public.expense_claims;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expense_claims;
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expense_claims;

CREATE POLICY "Users can view expenses in their company" ON public.expense_claims
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Users can manage their own expenses" ON public.expense_claims
FOR ALL USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Admins can manage expenses" ON public.expense_claims
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- PAYSLIPS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view payslips in their company" ON public.payslips;
DROP POLICY IF EXISTS "Users can view their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Admins can manage payslips" ON public.payslips;

CREATE POLICY "Users can view payslips in their company" ON public.payslips
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Users can view their own payslips" ON public.payslips
FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Admins can manage payslips" ON public.payslips
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- =============================================
-- ROLES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view roles in their company" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;

CREATE POLICY "Users can view roles in their company" ON public.roles
FOR SELECT USING (
  is_super_admin((SELECT auth.uid())) OR 
  company_id = get_user_company_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage roles" ON public.roles
FOR ALL USING (
  is_super_admin((SELECT auth.uid())) OR 
  (company_id = get_user_company_id((SELECT auth.uid())) AND has_role((SELECT auth.uid()), 'admin'))
);