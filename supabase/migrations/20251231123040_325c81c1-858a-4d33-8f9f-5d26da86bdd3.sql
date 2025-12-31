
-- =====================================================
-- PHASE 3 PART 3: FINAL RLS POLICIES
-- =====================================================

-- ========== INTERNAL INVOICES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all invoices" ON public.internal_invoices;
DROP POLICY IF EXISTS "Store managers can view their store invoices" ON public.internal_invoices;

CREATE POLICY "Super admins can manage all internal invoices"
ON public.internal_invoices FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage internal invoices"
ON public.internal_invoices FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view internal invoices in their company"
ON public.internal_invoices FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== INTERNAL INVOICE ITEMS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage all invoice items" ON public.internal_invoice_items;
DROP POLICY IF EXISTS "Store managers can view items for their store invoices" ON public.internal_invoice_items;

CREATE POLICY "Super admins can manage all invoice items"
ON public.internal_invoice_items FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage invoice items"
ON public.internal_invoice_items FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view invoice items in their company"
ON public.internal_invoice_items FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== INTERNAL INVOICE CATEGORIES TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage invoice categories" ON public.internal_invoice_categories;
DROP POLICY IF EXISTS "Authenticated users can view active categories" ON public.internal_invoice_categories;

CREATE POLICY "Super admins can manage all invoice categories"
ON public.internal_invoice_categories FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage invoice categories"
ON public.internal_invoice_categories FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view invoice categories in their company"
ON public.internal_invoice_categories FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== NOTIFICATIONS TABLE ==========
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Super admins can manage all notifications"
ON public.notifications FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage notifications"
ON public.notifications FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view notifications in their company"
ON public.notifications FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update notifications in their company"
ON public.notifications FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert notifications in their company"
ON public.notifications FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- ========== TARGETED NOTIFICATIONS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage targeted notifications" ON public.targeted_notifications;
DROP POLICY IF EXISTS "Users can view their targeted notifications" ON public.targeted_notifications;

CREATE POLICY "Super admins can manage all targeted notifications"
ON public.targeted_notifications FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage targeted notifications"
ON public.targeted_notifications FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view targeted notifications in their company"
ON public.targeted_notifications FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== HOLIDAYS TABLE ==========
DROP POLICY IF EXISTS "Admins can manage holidays" ON public.holidays;
DROP POLICY IF EXISTS "Authenticated users can view holidays" ON public.holidays;

CREATE POLICY "Super admins can manage all holidays"
ON public.holidays FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage holidays"
ON public.holidays FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view holidays in their company"
ON public.holidays FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== SYSTEM SETTINGS TABLE ==========
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON public.system_settings;

CREATE POLICY "Super admins can manage all system settings"
ON public.system_settings FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage system settings"
ON public.system_settings FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view system settings in their company"
ON public.system_settings FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== ROLES TABLE ==========
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;

CREATE POLICY "Super admins can manage all roles"
ON public.roles FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage roles"
ON public.roles FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view roles in their company"
ON public.roles FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== USER ROLES TABLE ==========
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Super admins can manage all user roles"
ON public.user_roles FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage user roles"
ON public.user_roles FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view user roles in their company"
ON public.user_roles FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== STATUS HISTORY TABLE ==========
DROP POLICY IF EXISTS "Admin can manage status history" ON public.status_history;
DROP POLICY IF EXISTS "Public can view status history" ON public.status_history;

CREATE POLICY "Super admins can manage all status history"
ON public.status_history FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage status history"
ON public.status_history FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view status history in their company"
ON public.status_history FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Public can view status history"
ON public.status_history FOR SELECT
USING (true);

-- ========== STATUS INCIDENTS TABLE ==========
DROP POLICY IF EXISTS "Admin can manage status incidents" ON public.status_incidents;
DROP POLICY IF EXISTS "Public can view status incidents" ON public.status_incidents;

CREATE POLICY "Super admins can manage all status incidents"
ON public.status_incidents FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage status incidents"
ON public.status_incidents FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view status incidents in their company"
ON public.status_incidents FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Public can view status incidents"
ON public.status_incidents FOR SELECT
USING (true);

-- ========== STATUS SUBSCRIBERS TABLE ==========
DROP POLICY IF EXISTS "Admin can manage status subscribers" ON public.status_subscribers;
DROP POLICY IF EXISTS "Public can subscribe" ON public.status_subscribers;

CREATE POLICY "Super admins can manage all status subscribers"
ON public.status_subscribers FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage status subscribers"
ON public.status_subscribers FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view status subscribers in their company"
ON public.status_subscribers FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Public can subscribe to status updates"
ON public.status_subscribers FOR INSERT
WITH CHECK (true);

-- ========== STATUS SUBSCRIPTIONS TABLE ==========
DROP POLICY IF EXISTS "Admin can manage status subscriptions" ON public.status_subscriptions;
DROP POLICY IF EXISTS "Public can manage their subscriptions" ON public.status_subscriptions;

CREATE POLICY "Super admins can manage all status subscriptions"
ON public.status_subscriptions FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage status subscriptions"
ON public.status_subscriptions FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view status subscriptions in their company"
ON public.status_subscriptions FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Public can manage their subscriptions"
ON public.status_subscriptions FOR ALL
USING (true);

-- ========== PROFILE CHANGE REQUESTS TABLE ==========
DROP POLICY IF EXISTS "Admin and HR can manage profile requests" ON public.profile_change_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.profile_change_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.profile_change_requests;

CREATE POLICY "Super admins can manage all profile change requests"
ON public.profile_change_requests FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage profile change requests"
ON public.profile_change_requests FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can create profile change requests in their company"
ON public.profile_change_requests FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view profile change requests in their company"
ON public.profile_change_requests FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- ========== USERS TABLE ==========
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;

CREATE POLICY "Super admins can manage all users"
ON public.users FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage users"
ON public.users FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);

CREATE POLICY "Users can view users in their company"
ON public.users FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their own record"
ON public.users FOR UPDATE
USING (id = auth.uid());

-- ========== REFRESH TOKENS TABLE ==========
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.refresh_tokens;

CREATE POLICY "Super admins can manage all refresh tokens"
ON public.refresh_tokens FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can manage their own refresh tokens"
ON public.refresh_tokens FOR ALL
USING (user_id = auth.uid());

-- ========== AUDIT LOGS TABLE ==========
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
