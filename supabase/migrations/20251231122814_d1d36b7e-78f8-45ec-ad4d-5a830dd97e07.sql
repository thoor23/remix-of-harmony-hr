
-- =====================================================
-- PHASE 3: UPDATE ALL RLS POLICIES FOR MULTI-TENANCY
-- =====================================================

-- ========== EMPLOYEES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Admin and HR can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;

CREATE POLICY "Super admins can manage all employees"
ON public.employees FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage employees"
ON public.employees FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view employees in their company"
ON public.employees FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== DEPARTMENTS TABLE ==========
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY "Super admins can manage all departments"
ON public.departments FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage departments"
ON public.departments FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view departments in their company"
ON public.departments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== DESIGNATIONS TABLE ==========
DROP POLICY IF EXISTS "Admins can manage designations" ON public.designations;
DROP POLICY IF EXISTS "Authenticated users can view designations" ON public.designations;

CREATE POLICY "Super admins can manage all designations"
ON public.designations FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage designations"
ON public.designations FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view designations in their company"
ON public.designations FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ATTENDANCE RECORDS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin and HR can view all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Employees can clock in" ON public.attendance_records;
DROP POLICY IF EXISTS "Employees can clock out" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_records;

CREATE POLICY "Super admins can manage all attendance"
ON public.attendance_records FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage attendance"
ON public.attendance_records FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Employees can clock in their company"
ON public.attendance_records FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can clock out in their company"
ON public.attendance_records FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view attendance in their company"
ON public.attendance_records FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ATTENDANCE REGULARIZATION REQUESTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all regularization requests" ON public.attendance_regularization_requests;
DROP POLICY IF EXISTS "Employees can create their own regularization requests" ON public.attendance_regularization_requests;
DROP POLICY IF EXISTS "Employees can view their own regularization requests" ON public.attendance_regularization_requests;

CREATE POLICY "Super admins can manage all regularization requests"
ON public.attendance_regularization_requests FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage regularization requests"
ON public.attendance_regularization_requests FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Employees can create regularization requests in their company"
ON public.attendance_regularization_requests FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can view regularization requests in their company"
ON public.attendance_regularization_requests FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== SHIFTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can view shifts" ON public.shifts;

CREATE POLICY "Super admins can manage all shifts"
ON public.shifts FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage shifts"
ON public.shifts FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view shifts in their company"
ON public.shifts FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== SHIFT ASSIGNMENTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage shift assignments" ON public.shift_assignments;
DROP POLICY IF EXISTS "Employees can view their own shift assignments" ON public.shift_assignments;

CREATE POLICY "Super admins can manage all shift assignments"
ON public.shift_assignments FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage shift assignments"
ON public.shift_assignments FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view shift assignments in their company"
ON public.shift_assignments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== SHIFT EXCHANGE REQUESTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage shift exchanges" ON public.shift_exchange_requests;
DROP POLICY IF EXISTS "Employees can create shift exchange requests" ON public.shift_exchange_requests;
DROP POLICY IF EXISTS "Employees can view their shift exchange requests" ON public.shift_exchange_requests;

CREATE POLICY "Super admins can manage all shift exchanges"
ON public.shift_exchange_requests FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage shift exchanges"
ON public.shift_exchange_requests FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can manage shift exchanges in their company"
ON public.shift_exchange_requests FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- ========== SHIFT ROTATIONS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage shift rotations" ON public.shift_rotations;
DROP POLICY IF EXISTS "Employees can view shift rotations" ON public.shift_rotations;

CREATE POLICY "Super admins can manage all shift rotations"
ON public.shift_rotations FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage shift rotations"
ON public.shift_rotations FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view shift rotations in their company"
ON public.shift_rotations FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== LEAVE TYPES TABLE ==========
DROP POLICY IF EXISTS "Admin can manage leave types" ON public.leave_types;
DROP POLICY IF EXISTS "Authenticated users can view leave types" ON public.leave_types;

CREATE POLICY "Super admins can manage all leave types"
ON public.leave_types FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage leave types"
ON public.leave_types FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view leave types in their company"
ON public.leave_types FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== LEAVE BALANCES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can view their own leave balances" ON public.leave_balances;

CREATE POLICY "Super admins can manage all leave balances"
ON public.leave_balances FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage leave balances"
ON public.leave_balances FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view leave balances in their company"
ON public.leave_balances FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== LEAVE REQUESTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can create their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON public.leave_requests;

CREATE POLICY "Super admins can manage all leave requests"
ON public.leave_requests FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage leave requests"
ON public.leave_requests FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can create leave requests in their company"
ON public.leave_requests FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view leave requests in their company"
ON public.leave_requests FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== SALARY STRUCTURES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage salary structures" ON public.salary_structures;
DROP POLICY IF EXISTS "Employees can view their own salary structure" ON public.salary_structures;

CREATE POLICY "Super admins can manage all salary structures"
ON public.salary_structures FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage salary structures"
ON public.salary_structures FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view salary structures in their company"
ON public.salary_structures FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== PAYSLIPS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage payslips" ON public.payslips;
DROP POLICY IF EXISTS "Employees can view their own payslips" ON public.payslips;

CREATE POLICY "Super admins can manage all payslips"
ON public.payslips FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage payslips"
ON public.payslips FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view payslips in their company"
ON public.payslips FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== PAYSLIP TEMPLATES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage payslip templates" ON public.payslip_templates;
DROP POLICY IF EXISTS "Authenticated users can view payslip templates" ON public.payslip_templates;

CREATE POLICY "Super admins can manage all payslip templates"
ON public.payslip_templates FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage payslip templates"
ON public.payslip_templates FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view payslip templates in their company"
ON public.payslip_templates FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ASSETS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all assets" ON public.assets;
DROP POLICY IF EXISTS "Employees can view their assigned assets" ON public.assets;
DROP POLICY IF EXISTS "Store managers can view assets in their stores" ON public.assets;

CREATE POLICY "Super admins can manage all assets"
ON public.assets FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage assets"
ON public.assets FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view assets in their company"
ON public.assets FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ASSET CATEGORIES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage asset categories" ON public.asset_categories;
DROP POLICY IF EXISTS "Authenticated users can view active categories" ON public.asset_categories;

CREATE POLICY "Super admins can manage all asset categories"
ON public.asset_categories FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage asset categories"
ON public.asset_categories FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view asset categories in their company"
ON public.asset_categories FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ASSET ASSIGNMENTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all assignments" ON public.asset_assignments;
DROP POLICY IF EXISTS "Employees can view their own assignments" ON public.asset_assignments;

CREATE POLICY "Super admins can manage all asset assignments"
ON public.asset_assignments FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage asset assignments"
ON public.asset_assignments FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view asset assignments in their company"
ON public.asset_assignments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ASSET MAINTENANCE TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all maintenance" ON public.asset_maintenance;
DROP POLICY IF EXISTS "Store managers can view maintenance for their store assets" ON public.asset_maintenance;

CREATE POLICY "Super admins can manage all asset maintenance"
ON public.asset_maintenance FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage asset maintenance"
ON public.asset_maintenance FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view asset maintenance in their company"
ON public.asset_maintenance FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ASSET MAINTENANCE REQUESTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all requests" ON public.asset_maintenance_requests;
DROP POLICY IF EXISTS "Employees can cancel own pending requests" ON public.asset_maintenance_requests;
DROP POLICY IF EXISTS "Employees can create maintenance requests" ON public.asset_maintenance_requests;
DROP POLICY IF EXISTS "Employees can view own requests" ON public.asset_maintenance_requests;

CREATE POLICY "Super admins can manage all maintenance requests"
ON public.asset_maintenance_requests FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage maintenance requests"
ON public.asset_maintenance_requests FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can create maintenance requests in their company"
ON public.asset_maintenance_requests FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view maintenance requests in their company"
ON public.asset_maintenance_requests FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own pending requests in their company"
ON public.asset_maintenance_requests FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ASSET TRANSFERS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all transfers" ON public.asset_transfers;
DROP POLICY IF EXISTS "Store managers can view transfers for their stores" ON public.asset_transfers;

CREATE POLICY "Super admins can manage all asset transfers"
ON public.asset_transfers FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage asset transfers"
ON public.asset_transfers FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view asset transfers in their company"
ON public.asset_transfers FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));
