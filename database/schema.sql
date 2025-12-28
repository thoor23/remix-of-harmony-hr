-- HRMS MySQL Database Schema
-- Run this script to create all required tables

-- Drop database if exists and create new
-- CREATE DATABASE IF NOT EXISTS hrms;
-- USE hrms;

-- =====================================================
-- ENUM-like tables (MySQL doesn't have native enums like PostgreSQL)
-- =====================================================

-- App roles lookup
CREATE TABLE IF NOT EXISTS app_roles (
    role VARCHAR(50) PRIMARY KEY
);

INSERT IGNORE INTO app_roles (role) VALUES ('admin'), ('hr'), ('manager'), ('employee');

-- =====================================================
-- CORE AUTHENTICATION TABLES
-- =====================================================

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email_confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_sign_in_at TIMESTAMP NULL,
    raw_user_meta_data JSON DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_users_email (email)
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    department VARCHAR(100),
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profiles_user_id (user_id)
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role) REFERENCES app_roles(role),
    UNIQUE KEY unique_user_role (user_id, role),
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role (role)
);

-- Refresh tokens for JWT
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user_id (user_id),
    INDEX idx_refresh_tokens_token (token)
);

-- =====================================================
-- ORGANIZATIONAL STRUCTURE
-- =====================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    head_id CHAR(36) NULL,
    employee_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_departments_code (code)
);

-- Designations
CREATE TABLE IF NOT EXISTS designations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    department_id CHAR(36) NULL,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_designations_code (code),
    INDEX idx_designations_department (department_id)
);

-- =====================================================
-- EMPLOYEE MANAGEMENT
-- =====================================================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NULL UNIQUE,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    department_id CHAR(36) NULL,
    designation_id CHAR(36) NULL,
    reporting_to CHAR(36) NULL,
    employment_type VARCHAR(50) DEFAULT 'full-time',
    status VARCHAR(20) DEFAULT 'active',
    date_of_birth DATE NULL,
    date_of_joining DATE NOT NULL DEFAULT (CURRENT_DATE),
    -- Address fields
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(100),
    address_zip_code VARCHAR(20),
    -- Emergency contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    -- Bank details
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_account_holder_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
    FOREIGN KEY (reporting_to) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employees_user_id (user_id),
    INDEX idx_employees_employee_id (employee_id),
    INDEX idx_employees_department (department_id),
    INDEX idx_employees_status (status)
);

-- Add foreign key for department head after employees table exists
ALTER TABLE departments ADD CONSTRAINT fk_department_head 
    FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;

-- =====================================================
-- ATTENDANCE MANAGEMENT
-- =====================================================

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    check_in TIME NULL,
    check_out TIME NULL,
    status VARCHAR(20) DEFAULT 'present',
    work_hours DECIMAL(5,2) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_id, date),
    INDEX idx_attendance_employee (employee_id),
    INDEX idx_attendance_date (date),
    INDEX idx_attendance_status (status)
);

-- =====================================================
-- SHIFT MANAGEMENT
-- =====================================================

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INT DEFAULT 60,
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_shifts_code (code),
    INDEX idx_shifts_active (is_active)
);

-- Shift assignments
CREATE TABLE IF NOT EXISTS shift_assignments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    shift_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    INDEX idx_shift_assignments_employee (employee_id),
    INDEX idx_shift_assignments_shift (shift_id),
    INDEX idx_shift_assignments_active (is_active)
);

-- Shift exchange requests
CREATE TABLE IF NOT EXISTS shift_exchange_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    requester_id CHAR(36) NOT NULL,
    target_employee_id CHAR(36) NOT NULL,
    requester_shift_id CHAR(36) NOT NULL,
    target_shift_id CHAR(36) NOT NULL,
    request_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    response_note TEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (target_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    INDEX idx_shift_exchange_requester (requester_id),
    INDEX idx_shift_exchange_target (target_employee_id),
    INDEX idx_shift_exchange_status (status)
);

-- =====================================================
-- LEAVE MANAGEMENT
-- =====================================================

-- Leave types
CREATE TABLE IF NOT EXISTS leave_types (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    max_days INT DEFAULT 12,
    color VARCHAR(20) DEFAULT '#3B82F6',
    carry_forward BOOLEAN DEFAULT FALSE,
    encashable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leave_types_code (code)
);

-- Leave balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    leave_type_id CHAR(36) NOT NULL,
    year INT NOT NULL DEFAULT (YEAR(CURRENT_DATE)),
    total_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_leave_year (employee_id, leave_type_id, year),
    INDEX idx_leave_balances_employee (employee_id),
    INDEX idx_leave_balances_year (year)
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    leave_type_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by CHAR(36) NULL,
    approved_on TIMESTAMP NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_leave_requests_employee (employee_id),
    INDEX idx_leave_requests_status (status),
    INDEX idx_leave_requests_dates (start_date, end_date)
);

-- =====================================================
-- PAYROLL MANAGEMENT
-- =====================================================

-- Salary structures
CREATE TABLE IF NOT EXISTS salary_structures (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    basic_salary DECIMAL(12,2) DEFAULT 0,
    hra DECIMAL(12,2) DEFAULT 0,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    medical_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    pf_deduction DECIMAL(12,2) DEFAULT 0,
    tax_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    effective_from DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_salary_structures_employee (employee_id),
    INDEX idx_salary_structures_effective (effective_from)
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    pay_period VARCHAR(20) NOT NULL,
    pay_date DATE NOT NULL,
    basic_salary DECIMAL(12,2) DEFAULT 0,
    gross_earnings DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_payslips_employee (employee_id),
    INDEX idx_payslips_period (pay_period),
    INDEX idx_payslips_status (status)
);

-- Payslip templates
CREATE TABLE IF NOT EXISTS payslip_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    company_name VARCHAR(200),
    company_address TEXT,
    company_logo_url VARCHAR(500),
    footer_text TEXT DEFAULT 'This is a computer-generated document and does not require a signature.',
    layout_config JSON DEFAULT ('{}'),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payslip_templates_active (is_active)
);

-- =====================================================
-- DOCUMENT MANAGEMENT
-- =====================================================

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_url VARCHAR(500),
    file_size INT,
    folder_path VARCHAR(500),
    employee_id CHAR(36) NULL,
    is_company_document BOOLEAN DEFAULT FALSE,
    document_category VARCHAR(50) DEFAULT 'employee_doc',
    uploaded_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_documents_employee (employee_id),
    INDEX idx_documents_category (document_category),
    INDEX idx_documents_company (is_company_document)
);

-- =====================================================
-- HOLIDAYS
-- =====================================================

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'public',
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_holidays_date (date),
    INDEX idx_holidays_type (type)
);

-- =====================================================
-- ANNOUNCEMENTS & TEMPLATES
-- =====================================================

-- Announcement banner templates
CREATE TABLE IF NOT EXISTS announcement_banner_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    html_content TEXT NOT NULL,
    priority_type VARCHAR(50) DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_banner_templates_active (is_active)
);

-- Announcement templates
CREATE TABLE IF NOT EXISTS announcement_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium',
    target_audience VARCHAR(50) DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_announcement_templates_active (is_active)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium',
    target_audience VARCHAR(50) DEFAULT 'all',
    banner_template_id CHAR(36) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (banner_template_id) REFERENCES announcement_banner_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_announcements_active (is_active),
    INDEX idx_announcements_published (published_at),
    INDEX idx_announcements_target (target_audience)
);

-- Letter templates
CREATE TABLE IF NOT EXISTS letter_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    placeholders JSON DEFAULT ('[]'),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1,
    created_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_letter_templates_type (type),
    INDEX idx_letter_templates_active (is_active)
);

-- Generated letters
CREATE TABLE IF NOT EXISTS generated_letters (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    template_id CHAR(36) NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    file_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'generated',
    metadata JSON DEFAULT ('{}'),
    generated_by CHAR(36) NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES letter_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_generated_letters_employee (employee_id),
    INDEX idx_generated_letters_type (type)
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    placeholders JSON DEFAULT ('[]'),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1,
    created_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email_templates_type (type),
    INDEX idx_email_templates_active (is_active)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
);

-- Targeted notifications
CREATE TABLE IF NOT EXISTS targeted_notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'medium',
    target_type VARCHAR(50) DEFAULT 'all',
    target_ids JSON DEFAULT ('[]'),
    sent_by CHAR(36) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_targeted_notifications_target (target_type),
    INDEX idx_targeted_notifications_sent (sent_at)
);

-- =====================================================
-- HELPDESK
-- =====================================================

-- Helpdesk tickets
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    assigned_to CHAR(36) NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_tickets_employee (employee_id),
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_priority (priority)
);

-- =====================================================
-- SYSTEM & AUDIT
-- =====================================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value JSON NOT NULL DEFAULT ('{}'),
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_system_settings_key (`key`),
    INDEX idx_system_settings_category (category)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    performed_by CHAR(36) NULL,
    performer_name VARCHAR(200),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSON DEFAULT ('{}'),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_performed_by (performed_by),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_module (module),
    INDEX idx_audit_logs_created (created_at)
);

-- =====================================================
-- DEFAULT DATA INSERTS
-- =====================================================

-- Insert default leave types
INSERT IGNORE INTO leave_types (id, name, code, max_days, color, carry_forward, encashable) VALUES
(UUID(), 'Casual Leave', 'CL', 12, '#3B82F6', FALSE, FALSE),
(UUID(), 'Sick Leave', 'SL', 10, '#EF4444', FALSE, FALSE),
(UUID(), 'Earned Leave', 'EL', 15, '#10B981', TRUE, TRUE),
(UUID(), 'Maternity Leave', 'ML', 180, '#EC4899', FALSE, FALSE),
(UUID(), 'Paternity Leave', 'PL', 15, '#8B5CF6', FALSE, FALSE);

-- Insert default shifts
INSERT IGNORE INTO shifts (id, name, code, start_time, end_time, break_duration, color) VALUES
(UUID(), 'General Shift', 'GEN', '09:00:00', '18:00:00', 60, '#3B82F6'),
(UUID(), 'Morning Shift', 'MOR', '06:00:00', '14:00:00', 30, '#10B981'),
(UUID(), 'Evening Shift', 'EVE', '14:00:00', '22:00:00', 30, '#F59E0B'),
(UUID(), 'Night Shift', 'NGT', '22:00:00', '06:00:00', 30, '#6366F1');

-- Insert default system settings
INSERT IGNORE INTO system_settings (id, `key`, value, category, description) VALUES
(UUID(), 'company_name', '"HRMS Company"', 'company', 'Company name'),
(UUID(), 'timezone', '"Asia/Kolkata"', 'general', 'Default timezone'),
(UUID(), 'date_format', '"DD/MM/YYYY"', 'general', 'Date display format'),
(UUID(), 'currency', '"INR"', 'general', 'Default currency'),
(UUID(), 'work_start_time', '"09:00"', 'attendance', 'Work start time'),
(UUID(), 'work_end_time', '"18:00"', 'attendance', 'Work end time'),
(UUID(), 'grace_minutes', '15', 'attendance', 'Grace period for late arrival');

COMMIT;
