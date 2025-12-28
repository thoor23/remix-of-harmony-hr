-- HRMS MySQL Seed Data
-- Run this script after schema.sql to add sample data

-- =====================================================
-- SAMPLE ADMIN USER
-- Password: Admin@123 (bcrypt hashed)
-- =====================================================

SET @admin_user_id = UUID();
SET @admin_employee_id = UUID();
SET @hr_user_id = UUID();
SET @hr_employee_id = UUID();
SET @emp_user_id = UUID();
SET @emp_employee_id = UUID();

-- Create admin user
-- Password: Admin@123 (bcrypt hash with cost factor 10)
-- To generate new hashes: Use bcryptjs in Node.js: bcrypt.hashSync('Admin@123', 10)
INSERT INTO users (id, email, password_hash, email_confirmed_at) VALUES
(@admin_user_id, 'admin@hrms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.F4H5X7U5Xa1LMGK1Sm', NOW()),
(@hr_user_id, 'hr@hrms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.F4H5X7U5Xa1LMGK1Sm', NOW()),
(@emp_user_id, 'employee@hrms.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.F4H5X7U5Xa1LMGK1Sm', NOW());

-- Create profiles
INSERT INTO profiles (id, user_id, first_name, last_name, email) VALUES
(UUID(), @admin_user_id, 'System', 'Admin', 'admin@hrms.com'),
(UUID(), @hr_user_id, 'HR', 'Manager', 'hr@hrms.com'),
(UUID(), @emp_user_id, 'John', 'Doe', 'employee@hrms.com');

-- Assign roles
INSERT INTO user_roles (id, user_id, role) VALUES
(UUID(), @admin_user_id, 'admin'),
(UUID(), @hr_user_id, 'hr'),
(UUID(), @emp_user_id, 'employee');

-- =====================================================
-- SAMPLE DEPARTMENTS
-- =====================================================

SET @dept_it_id = UUID();
SET @dept_hr_id = UUID();
SET @dept_finance_id = UUID();
SET @dept_sales_id = UUID();

INSERT INTO departments (id, name, code, description, employee_count) VALUES
(@dept_it_id, 'Information Technology', 'IT', 'Software development and IT support', 0),
(@dept_hr_id, 'Human Resources', 'HR', 'HR and talent management', 0),
(@dept_finance_id, 'Finance', 'FIN', 'Financial planning and accounting', 0),
(@dept_sales_id, 'Sales', 'SALES', 'Sales and business development', 0);

-- =====================================================
-- SAMPLE DESIGNATIONS
-- =====================================================

SET @desig_se_id = UUID();
SET @desig_sse_id = UUID();
SET @desig_hr_exec_id = UUID();
SET @desig_hr_mgr_id = UUID();

INSERT INTO designations (id, name, code, department_id, level) VALUES
(@desig_se_id, 'Software Engineer', 'SE', @dept_it_id, 1),
(@desig_sse_id, 'Senior Software Engineer', 'SSE', @dept_it_id, 2),
(UUID(), 'Tech Lead', 'TL', @dept_it_id, 3),
(@desig_hr_exec_id, 'HR Executive', 'HRE', @dept_hr_id, 1),
(@desig_hr_mgr_id, 'HR Manager', 'HRM', @dept_hr_id, 2),
(UUID(), 'Finance Executive', 'FE', @dept_finance_id, 1),
(UUID(), 'Finance Manager', 'FM', @dept_finance_id, 2),
(UUID(), 'Sales Executive', 'SE', @dept_sales_id, 1),
(UUID(), 'Sales Manager', 'SM', @dept_sales_id, 2);

-- =====================================================
-- SAMPLE EMPLOYEES
-- =====================================================

INSERT INTO employees (id, user_id, employee_id, department_id, designation_id, status, date_of_joining) VALUES
(@admin_employee_id, @admin_user_id, 'EMP001', @dept_it_id, @desig_sse_id, 'active', '2020-01-01'),
(@hr_employee_id, @hr_user_id, 'EMP002', @dept_hr_id, @desig_hr_mgr_id, 'active', '2020-01-15'),
(@emp_employee_id, @emp_user_id, 'EMP003', @dept_it_id, @desig_se_id, 'active', '2023-06-01');

-- Update department employee counts
UPDATE departments SET employee_count = 2 WHERE id = @dept_it_id;
UPDATE departments SET employee_count = 1 WHERE id = @dept_hr_id;

-- =====================================================
-- SAMPLE HOLIDAYS (2024-2025)
-- =====================================================

INSERT INTO holidays (id, name, date, description, type, is_optional) VALUES
(UUID(), 'New Year', '2025-01-01', 'New Year Day', 'public', FALSE),
(UUID(), 'Republic Day', '2025-01-26', 'Republic Day of India', 'public', FALSE),
(UUID(), 'Holi', '2025-03-14', 'Festival of Colors', 'public', FALSE),
(UUID(), 'Good Friday', '2025-04-18', 'Good Friday', 'public', FALSE),
(UUID(), 'Independence Day', '2025-08-15', 'Independence Day of India', 'public', FALSE),
(UUID(), 'Gandhi Jayanti', '2025-10-02', 'Birthday of Mahatma Gandhi', 'public', FALSE),
(UUID(), 'Diwali', '2025-10-20', 'Festival of Lights', 'public', FALSE),
(UUID(), 'Christmas', '2025-12-25', 'Christmas Day', 'public', FALSE);

-- =====================================================
-- SAMPLE ANNOUNCEMENTS
-- =====================================================

INSERT INTO announcements (id, title, content, type, priority, target_audience, is_active, created_by) VALUES
(UUID(), 'Welcome to HRMS', 'Welcome to our new HR Management System. Please explore the features and let us know your feedback.', 'general', 'high', 'all', TRUE, @admin_user_id),
(UUID(), 'Office Timings Update', 'Please note that office timings are now 9 AM to 6 PM with a 1-hour lunch break.', 'policy', 'medium', 'all', TRUE, @hr_user_id);

-- =====================================================
-- SAMPLE LEAVE BALANCES FOR EMPLOYEES
-- =====================================================

-- Get leave type IDs
SET @cl_id = (SELECT id FROM leave_types WHERE code = 'CL' LIMIT 1);
SET @sl_id = (SELECT id FROM leave_types WHERE code = 'SL' LIMIT 1);
SET @el_id = (SELECT id FROM leave_types WHERE code = 'EL' LIMIT 1);

-- Add leave balances for sample employee
INSERT INTO leave_balances (id, employee_id, leave_type_id, year, total_days, used_days, pending_days) VALUES
(UUID(), @emp_employee_id, @cl_id, 2025, 12, 2, 0),
(UUID(), @emp_employee_id, @sl_id, 2025, 10, 1, 0),
(UUID(), @emp_employee_id, @el_id, 2025, 15, 0, 0);

-- =====================================================
-- SAMPLE SALARY STRUCTURE
-- =====================================================

INSERT INTO salary_structures (id, employee_id, basic_salary, hra, transport_allowance, medical_allowance, other_allowances, pf_deduction, tax_deduction, effective_from) VALUES
(UUID(), @emp_employee_id, 50000, 20000, 5000, 2500, 5000, 6000, 5000, '2023-06-01');

COMMIT;
