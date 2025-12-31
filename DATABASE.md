# 🗄️ HRMS Database Documentation

<div align="center">

**Complete Database Schema Reference for the Human Resource Management System**

[Overview](#-overview) • [Tables](#-tables) • [Functions](#-database-functions) • [RLS Policies](#-rls-policies) • [ERD](#-entity-relationship-diagram)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Database Architecture](#-database-architecture)
- [Tables](#-tables)
  - [Core Tables](#core-tables)
  - [Employee Tables](#employee-tables)
  - [Attendance Tables](#attendance-tables)
  - [Leave Tables](#leave-tables)
  - [Payroll Tables](#payroll-tables)
  - [Shift Tables](#shift-tables)
  - [Asset Tables](#asset-tables)
  - [Expense Tables](#expense-tables)
  - [Helpdesk Tables](#helpdesk-tables)
  - [Recruitment Tables](#recruitment-tables)
  - [Onboarding/Offboarding Tables](#onboardingoffboarding-tables)
  - [Location Tables](#location-tables)
  - [Template Tables](#template-tables)
  - [Communication Tables](#communication-tables)
  - [Document Tables](#document-tables)
  - [Invoice Tables](#invoice-tables)
  - [Other Tables](#other-tables)
- [Database Functions](#-database-functions)
- [RLS Policies](#-rls-policies)
- [Entity Relationship Diagram](#-entity-relationship-diagram)
- [Indexes & Performance](#-indexes--performance)
- [Data Types & Enums](#-data-types--enums)
- [Storage Buckets](#-storage-buckets)
- [Migration Guide](#-migration-guide)

---

## 🌐 Overview

The HRMS database is built on **PostgreSQL** hosted on **Supabase**. It implements a **multi-tenant architecture** with complete data isolation using **Row Level Security (RLS)**.

### Key Features

| Feature | Implementation |
|---------|----------------|
| **Database** | PostgreSQL 15+ |
| **Platform** | Supabase (Lovable Cloud) |
| **Multi-Tenancy** | Company-scoped with RLS |
| **Authentication** | Supabase Auth (JWT) |
| **File Storage** | Supabase Storage |
| **Realtime** | Supabase Realtime subscriptions |

### Database Statistics

| Metric | Count |
|--------|-------|
| **Tables** | 50+ |
| **Functions** | 15+ |
| **RLS Policies** | 150+ |
| **Indexes** | 80+ |
| **Storage Buckets** | 3 |

---

## 🏗️ Database Architecture

### Multi-Tenant Design

```
┌─────────────────────────────────────────────────────────────┐
│                        companies                            │
│  (Root table - all other tables reference company_id)       │
├──────────────────────┬──────────────────────────────────────┤
│     Company A        │           Company B                  │
├──────────────────────┼──────────────────────────────────────┤
│ • employees          │ • employees                          │
│ • departments        │ • departments                        │
│ • attendance         │ • attendance                         │
│ • leaves             │ • leaves                             │
│ • assets             │ • assets                             │
│ • ...                │ • ...                                │
└──────────────────────┴──────────────────────────────────────┘
```

### Schema Organization

```
public/
├── Core Tables (companies, users, roles, super_admins)
├── Employee Tables (employees, departments, designations)
├── HR Tables (attendance, leaves, payroll, shifts)
├── Asset Tables (assets, categories, assignments, maintenance)
├── Communication Tables (announcements, notifications)
├── Recruitment Tables (jobs, applications, interviews)
├── Template Tables (email, letter, payslip templates)
└── Other Tables (holidays, audit_logs, documents)
```

---

## 📊 Tables

---

### Core Tables

#### `companies`

Root table for multi-tenant architecture. All other tables reference this via `company_id`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Company name |
| `code` | text | No | - | Unique company code |
| `email` | text | No | - | Company email |
| `phone` | text | Yes | - | Company phone |
| `website` | text | Yes | - | Company website |
| `address` | text | Yes | - | Company address |
| `domain` | text | Yes | - | Custom domain |
| `logo_url` | text | Yes | - | Company logo URL |
| `favicon_url` | text | Yes | - | Favicon URL |
| `timezone` | text | Yes | `'Asia/Kolkata'` | Company timezone |
| `currency` | text | Yes | `'INR'` | Currency code |
| `date_format` | text | Yes | `'DD/MM/YYYY'` | Date format |
| `max_employees` | integer | Yes | `50` | Max employee limit |
| `subscription_plan` | text | Yes | `'basic'` | Subscription plan |
| `subscription_status` | text | Yes | `'active'` | Subscription status |
| `subscription_expires_at` | timestamptz | Yes | - | Expiry date |
| `settings` | jsonb | Yes | `'{}'` | Custom settings |
| `is_active` | boolean | Yes | `true` | Company active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

**Indexes:**
- `companies_pkey` - Primary key on `id`
- `companies_code_key` - Unique index on `code`
- `companies_email_key` - Unique index on `email`

---

#### `super_admins`

Platform-level administrators with access to all companies.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Reference to auth.users |
| `email` | text | No | - | Super admin email |
| `name` | text | Yes | - | Display name |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

**Indexes:**
- `super_admins_pkey` - Primary key on `id`
- `super_admins_user_id_key` - Unique index on `user_id`
- `super_admins_email_key` - Unique index on `email`

---

#### `roles`

Role definitions with JSON permissions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Role name |
| `code` | text | No | - | Role code (admin, hr, employee) |
| `description` | text | Yes | - | Role description |
| `permissions` | jsonb | Yes | `'{}'` | Permission matrix |
| `is_default` | boolean | Yes | `false` | Default role flag |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

**Permission Structure:**
```json
{
  "employees": { "create": true, "read": true, "update": true, "delete": false },
  "attendance": { "create": true, "read": true, "update": true, "delete": false },
  "leaves": { "create": true, "read": true, "update": true, "delete": false },
  "payroll": { "create": false, "read": true, "update": false, "delete": false },
  "assets": { "create": true, "read": true, "update": true, "delete": false },
  "settings": { "create": false, "read": true, "update": false, "delete": false }
}
```

---

#### `user_roles`

Maps users to roles within companies.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Reference to auth.users |
| `role_id` | uuid | No | - | FK to roles |
| `company_id` | uuid | No | - | FK to companies |
| `assigned_by` | uuid | Yes | - | Who assigned the role |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `profiles`

Extended user profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Reference to auth.users |
| `company_id` | uuid | No | - | FK to companies |
| `avatar_url` | text | Yes | - | Profile avatar URL |
| `preferences` | jsonb | Yes | `'{}'` | User preferences |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Employee Tables

#### `employees`

Core employee records with all personal and professional details.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `user_id` | uuid | Yes | - | Reference to auth.users |
| `employee_id` | text | No | - | Employee code (EMP001) |
| `first_name` | text | Yes | - | First name |
| `last_name` | text | Yes | - | Last name |
| `email` | text | Yes | - | Employee email |
| `phone` | text | Yes | - | Phone number |
| `avatar_url` | text | Yes | - | Profile photo URL |
| `date_of_birth` | date | Yes | - | Birth date |
| `date_of_joining` | date | No | `CURRENT_DATE` | Joining date |
| `department_id` | uuid | Yes | - | FK to departments |
| `designation_id` | uuid | Yes | - | FK to designations |
| `reporting_to` | uuid | Yes | - | FK to employees (manager) |
| `primary_store_id` | uuid | Yes | - | FK to stores |
| `employment_type` | text | No | `'full-time'` | Employment type |
| `status` | text | No | `'active'` | Employee status |
| `address_street` | text | Yes | - | Street address |
| `address_city` | text | Yes | - | City |
| `address_state` | text | Yes | - | State/Province |
| `address_country` | text | Yes | - | Country |
| `address_zip_code` | text | Yes | - | ZIP/Postal code |
| `emergency_contact_name` | text | Yes | - | Emergency contact name |
| `emergency_contact_phone` | text | Yes | - | Emergency contact phone |
| `emergency_contact_relationship` | text | Yes | - | Relationship |
| `bank_name` | text | Yes | - | Bank name |
| `bank_account_number` | text | Yes | - | Account number |
| `bank_ifsc_code` | text | Yes | - | IFSC/SWIFT code |
| `bank_account_holder_name` | text | Yes | - | Account holder name |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

**Indexes:**
- `employees_pkey` - Primary key on `id`
- `employees_company_id_idx` - Index on `company_id`
- `employees_employee_id_company_id_key` - Unique on (`employee_id`, `company_id`)
- `employees_user_id_idx` - Index on `user_id`
- `employees_department_id_idx` - Index on `department_id`
- `employees_status_idx` - Index on `status`

---

#### `departments`

Company departments/divisions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Department name |
| `code` | text | No | - | Department code |
| `description` | text | Yes | - | Description |
| `head_id` | uuid | Yes | - | FK to employees (head) |
| `employee_count` | integer | Yes | `0` | Employee count |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `designations`

Job titles/designations with hierarchy levels.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Designation name |
| `code` | text | No | - | Designation code |
| `department_id` | uuid | Yes | - | FK to departments |
| `level` | integer | Yes | `1` | Hierarchy level |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `profile_change_requests`

Employee-initiated profile update requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `field_name` | text | No | - | Field to change |
| `current_value` | text | Yes | - | Current value |
| `requested_value` | text | No | - | Requested value |
| `reason` | text | Yes | - | Change reason |
| `status` | text | No | `'pending'` | Request status |
| `reviewed_by` | uuid | Yes | - | FK to employees |
| `reviewed_at` | timestamptz | Yes | - | Review timestamp |
| `review_comments` | text | Yes | - | Review comments |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Attendance Tables

#### `attendance_records`

Daily attendance entries with clock in/out times.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `date` | date | No | - | Attendance date |
| `check_in` | time | Yes | - | Clock in time |
| `check_out` | time | Yes | - | Clock out time |
| `work_hours` | numeric | Yes | - | Calculated work hours |
| `status` | text | No | `'present'` | Attendance status |
| `store_id` | uuid | Yes | - | FK to stores |
| `notes` | text | Yes | - | Notes |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

**Indexes:**
- `attendance_records_pkey` - Primary key on `id`
- `attendance_records_employee_date_idx` - Unique on (`employee_id`, `date`)
- `attendance_records_company_id_idx` - Index on `company_id`
- `attendance_records_date_idx` - Index on `date`

---

#### `attendance_regularization_requests`

Requests to correct attendance entries.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `attendance_id` | uuid | Yes | - | FK to attendance_records |
| `request_date` | date | No | - | Date to regularize |
| `request_type` | text | No | `'correction'` | Type (correction/missing) |
| `original_check_in` | time | Yes | - | Original check in |
| `original_check_out` | time | Yes | - | Original check out |
| `requested_check_in` | time | Yes | - | Requested check in |
| `requested_check_out` | time | Yes | - | Requested check out |
| `reason` | text | No | - | Request reason |
| `status` | text | No | `'pending'` | Request status |
| `reviewed_by` | uuid | Yes | - | FK to employees |
| `reviewed_at` | timestamptz | Yes | - | Review timestamp |
| `review_comments` | text | Yes | - | Review comments |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Leave Tables

#### `leave_types`

Configurable leave type definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Leave type name |
| `code` | text | No | - | Leave type code |
| `description` | text | Yes | - | Description |
| `default_days` | integer | Yes | `0` | Default annual days |
| `max_days` | integer | Yes | `0` | Maximum days allowed |
| `carry_forward` | boolean | Yes | `false` | Allow carry forward |
| `carry_forward_max` | integer | Yes | `0` | Max carry forward days |
| `is_paid` | boolean | Yes | `true` | Is paid leave |
| `is_active` | boolean | Yes | `true` | Active status |
| `color` | text | Yes | `'#3B82F6'` | Display color |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `leave_balances`

Employee leave balance tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `leave_type_id` | uuid | No | - | FK to leave_types |
| `year` | integer | No | - | Balance year |
| `total_days` | numeric | No | `0` | Total allocated days |
| `used_days` | numeric | No | `0` | Days used |
| `pending_days` | numeric | No | `0` | Days pending approval |
| `carry_forward_days` | numeric | No | `0` | Carried from previous year |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `leave_requests`

Leave applications with approval workflow.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `leave_type_id` | uuid | No | - | FK to leave_types |
| `start_date` | date | No | - | Leave start date |
| `end_date` | date | No | - | Leave end date |
| `total_days` | numeric | No | - | Total leave days |
| `is_half_day` | boolean | Yes | `false` | Half day leave |
| `half_day_type` | text | Yes | - | First/second half |
| `reason` | text | Yes | - | Leave reason |
| `status` | text | No | `'pending'` | Request status |
| `approved_by` | uuid | Yes | - | FK to employees |
| `approved_at` | timestamptz | Yes | - | Approval timestamp |
| `rejection_reason` | text | Yes | - | Rejection reason |
| `cancelled_at` | timestamptz | Yes | - | Cancellation timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Payroll Tables

#### `salary_structures`

Employee salary component definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `basic_salary` | numeric | No | `0` | Basic salary |
| `hra` | numeric | Yes | `0` | House Rent Allowance |
| `da` | numeric | Yes | `0` | Dearness Allowance |
| `conveyance` | numeric | Yes | `0` | Conveyance allowance |
| `medical` | numeric | Yes | `0` | Medical allowance |
| `special_allowance` | numeric | Yes | `0` | Special allowance |
| `other_earnings` | jsonb | Yes | `'[]'` | Other earnings |
| `pf_employee` | numeric | Yes | `0` | Employee PF contribution |
| `pf_employer` | numeric | Yes | `0` | Employer PF contribution |
| `esi_employee` | numeric | Yes | `0` | Employee ESI |
| `esi_employer` | numeric | Yes | `0` | Employer ESI |
| `professional_tax` | numeric | Yes | `0` | Professional tax |
| `tds` | numeric | Yes | `0` | Tax deducted at source |
| `other_deductions` | jsonb | Yes | `'[]'` | Other deductions |
| `effective_from` | date | No | - | Effective date |
| `effective_to` | date | Yes | - | End date |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `payslips`

Generated monthly payslips.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `month` | integer | No | - | Payslip month (1-12) |
| `year` | integer | No | - | Payslip year |
| `working_days` | integer | Yes | `0` | Total working days |
| `days_worked` | integer | Yes | `0` | Days actually worked |
| `basic_salary` | numeric | No | `0` | Basic salary |
| `gross_earnings` | numeric | No | `0` | Total earnings |
| `total_deductions` | numeric | No | `0` | Total deductions |
| `net_salary` | numeric | No | `0` | Net payable |
| `earnings` | jsonb | Yes | `'{}'` | Earnings breakdown |
| `deductions` | jsonb | Yes | `'{}'` | Deductions breakdown |
| `status` | text | No | `'draft'` | Payslip status |
| `generated_at` | timestamptz | Yes | - | Generation timestamp |
| `generated_by` | uuid | Yes | - | FK to employees |
| `paid_at` | timestamptz | Yes | - | Payment timestamp |
| `payment_reference` | text | Yes | - | Payment reference |
| `notes` | text | Yes | - | Notes |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Shift Tables

#### `shifts`

Shift definitions with timings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Shift name |
| `code` | text | No | - | Shift code |
| `start_time` | time | No | - | Start time |
| `end_time` | time | No | - | End time |
| `break_duration` | integer | Yes | `60` | Break in minutes |
| `is_night_shift` | boolean | Yes | `false` | Night shift flag |
| `color` | text | Yes | `'#3B82F6'` | Display color |
| `description` | text | Yes | - | Description |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `shift_assignments`

Employee shift assignments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `shift_id` | uuid | No | - | FK to shifts |
| `start_date` | date | No | - | Assignment start |
| `end_date` | date | Yes | - | Assignment end |
| `is_active` | boolean | Yes | `true` | Active status |
| `assigned_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `shift_rotations`

Automatic shift rotation schedules.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Rotation name |
| `shift_sequence` | jsonb | No | `'[]'` | Shift order |
| `rotation_period` | text | No | `'weekly'` | Period (weekly/monthly) |
| `start_date` | date | No | - | Start date |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `shift_exchange_requests`

Shift swap requests between employees.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `requester_id` | uuid | No | - | FK to employees |
| `requester_assignment_id` | uuid | No | - | FK to shift_assignments |
| `target_id` | uuid | No | - | FK to employees (target) |
| `target_assignment_id` | uuid | No | - | FK to shift_assignments |
| `reason` | text | Yes | - | Exchange reason |
| `status` | text | No | `'pending'` | Request status |
| `approved_by` | uuid | Yes | - | FK to employees |
| `approved_at` | timestamptz | Yes | - | Approval timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Asset Tables

#### `asset_categories`

Asset type categories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Category name |
| `code` | text | No | - | Category code |
| `description` | text | Yes | - | Description |
| `icon` | text | Yes | `'Package'` | Icon name |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `assets`

Company asset inventory.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Asset name |
| `asset_tag` | text | No | - | Unique asset tag |
| `category_id` | uuid | Yes | - | FK to asset_categories |
| `brand` | text | Yes | - | Brand name |
| `model` | text | Yes | - | Model name |
| `serial_number` | text | Yes | - | Serial number |
| `purchase_date` | date | Yes | - | Purchase date |
| `purchase_cost` | numeric | Yes | `0` | Purchase cost |
| `warranty_expiry` | date | Yes | - | Warranty expiry |
| `location_id` | uuid | Yes | - | FK to stores |
| `assigned_to` | uuid | Yes | - | FK to employees |
| `assigned_date` | date | Yes | - | Assignment date |
| `status` | text | No | `'available'` | Asset status |
| `condition` | text | Yes | `'good'` | Asset condition |
| `specifications` | jsonb | Yes | `'{}'` | Technical specs |
| `image_url` | text | Yes | - | Asset image URL |
| `notes` | text | Yes | - | Notes |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

**Indexes:**
- `assets_pkey` - Primary key on `id`
- `assets_asset_tag_company_id_key` - Unique on (`asset_tag`, `company_id`)
- `assets_company_id_idx` - Index on `company_id`
- `assets_status_idx` - Index on `status`
- `assets_assigned_to_idx` - Index on `assigned_to`

---

#### `asset_assignments`

Asset assignment history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `asset_id` | uuid | No | - | FK to assets |
| `employee_id` | uuid | No | - | FK to employees |
| `assigned_date` | date | No | `CURRENT_DATE` | Assignment date |
| `returned_date` | date | Yes | - | Return date |
| `assigned_by` | uuid | Yes | - | FK to employees |
| `location_id` | uuid | Yes | - | FK to stores |
| `condition_on_assign` | text | Yes | - | Condition at assignment |
| `condition_on_return` | text | Yes | - | Condition at return |
| `notes` | text | Yes | - | Notes |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

#### `asset_maintenance`

Scheduled asset maintenance records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `asset_id` | uuid | No | - | FK to assets |
| `type` | text | No | `'service'` | Maintenance type |
| `description` | text | Yes | - | Description |
| `scheduled_date` | date | Yes | - | Scheduled date |
| `completed_date` | date | Yes | - | Completion date |
| `cost` | numeric | Yes | `0` | Maintenance cost |
| `vendor` | text | Yes | - | Vendor name |
| `status` | text | No | `'scheduled'` | Maintenance status |
| `notes` | text | Yes | - | Notes |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `asset_maintenance_requests`

Employee-submitted maintenance requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `asset_id` | uuid | No | - | FK to assets |
| `employee_id` | uuid | No | - | FK to employees (requester) |
| `type` | text | No | `'repair'` | Request type |
| `description` | text | No | - | Issue description |
| `priority` | text | No | `'medium'` | Priority level |
| `status` | text | No | `'pending'` | Request status |
| `scheduled_date` | date | Yes | - | Scheduled date |
| `estimated_cost` | numeric | Yes | - | Estimated cost |
| `actual_cost` | numeric | Yes | - | Actual cost |
| `assigned_to` | text | Yes | - | Assigned vendor/person |
| `reviewed_by` | uuid | Yes | - | FK to employees |
| `reviewed_at` | timestamptz | Yes | - | Review timestamp |
| `review_comments` | text | Yes | - | Review comments |
| `resolution_notes` | text | Yes | - | Resolution notes |
| `completed_at` | timestamptz | Yes | - | Completion timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `asset_transfers`

Asset transfer between locations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `asset_id` | uuid | No | - | FK to assets |
| `from_location_id` | uuid | Yes | - | FK to stores (from) |
| `to_location_id` | uuid | No | - | FK to stores (to) |
| `transfer_date` | date | No | `CURRENT_DATE` | Transfer date |
| `reason` | text | Yes | - | Transfer reason |
| `status` | text | No | `'completed'` | Transfer status |
| `notes` | text | Yes | - | Notes |
| `transferred_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Expense Tables

#### `expense_categories`

Expense type categories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Category name |
| `code` | text | No | - | Category code |
| `description` | text | Yes | - | Description |
| `max_amount` | numeric | Yes | `0` | Max claim amount |
| `requires_receipt` | boolean | Yes | `true` | Receipt required |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `expense_claims`

Employee expense reimbursement claims.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `title` | text | No | - | Expense title |
| `category_id` | uuid | No | - | FK to expense_categories |
| `amount` | numeric | No | `0` | Claim amount |
| `expense_date` | date | No | `CURRENT_DATE` | Expense date |
| `description` | text | Yes | - | Description |
| `receipt_url` | text | Yes | - | Receipt file URL |
| `status` | text | No | `'pending'` | Claim status |
| `submitted_at` | timestamptz | No | `now()` | Submission timestamp |
| `reviewed_by` | uuid | Yes | - | FK to employees |
| `reviewed_at` | timestamptz | Yes | - | Review timestamp |
| `review_comments` | text | Yes | - | Review comments |
| `reimbursed_at` | timestamptz | Yes | - | Reimbursement timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `expense_policies`

Company expense policies.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Policy name |
| `max_monthly_limit` | numeric | Yes | `0` | Monthly limit |
| `auto_approve_below` | numeric | Yes | `0` | Auto-approve threshold |
| `requires_manager_approval` | boolean | Yes | `true` | Manager approval needed |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Helpdesk Tables

#### `helpdesk_tickets`

Support tickets.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees (creator) |
| `subject` | text | No | - | Ticket subject |
| `description` | text | Yes | - | Issue description |
| `category` | text | No | `'General'` | Ticket category |
| `priority` | text | No | `'medium'` | Priority level |
| `status` | text | No | `'open'` | Ticket status |
| `assigned_to` | uuid | Yes | - | FK to employees (agent) |
| `resolved_at` | timestamptz | Yes | - | Resolution timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `helpdesk_ticket_messages`

Ticket conversation messages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `ticket_id` | uuid | No | - | FK to helpdesk_tickets |
| `sender_id` | uuid | No | - | FK to employees |
| `message` | text | No | - | Message content |
| `is_internal` | boolean | Yes | `false` | Internal note flag |
| `attachments` | jsonb | Yes | `'[]'` | File attachments |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

### Recruitment Tables

#### `job_openings`

Job postings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `title` | text | No | - | Job title |
| `department_id` | uuid | Yes | - | FK to departments |
| `location` | text | Yes | - | Job location |
| `employment_type` | text | No | `'full-time'` | Employment type |
| `experience_min` | integer | Yes | `0` | Min experience (years) |
| `experience_max` | integer | Yes | - | Max experience (years) |
| `salary_min` | numeric | Yes | - | Min salary |
| `salary_max` | numeric | Yes | - | Max salary |
| `description` | text | Yes | - | Job description |
| `requirements` | text | Yes | - | Requirements |
| `responsibilities` | text | Yes | - | Responsibilities |
| `benefits` | text | Yes | - | Benefits |
| `vacancies` | integer | Yes | `1` | Number of positions |
| `deadline` | date | Yes | - | Application deadline |
| `status` | text | No | `'draft'` | Job status |
| `is_remote` | boolean | Yes | `false` | Remote work option |
| `published_at` | timestamptz | Yes | - | Published timestamp |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `job_applications`

Job applications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `job_id` | uuid | No | - | FK to job_openings |
| `first_name` | text | No | - | Applicant first name |
| `last_name` | text | No | - | Applicant last name |
| `email` | text | No | - | Applicant email |
| `phone` | text | Yes | - | Applicant phone |
| `resume_url` | text | Yes | - | Resume file URL |
| `cover_letter` | text | Yes | - | Cover letter |
| `experience_years` | integer | Yes | - | Years of experience |
| `current_salary` | numeric | Yes | - | Current salary |
| `expected_salary` | numeric | Yes | - | Expected salary |
| `notice_period` | text | Yes | - | Notice period |
| `linkedin_url` | text | Yes | - | LinkedIn profile |
| `portfolio_url` | text | Yes | - | Portfolio URL |
| `stage` | text | No | `'applied'` | Current stage |
| `status` | text | No | `'active'` | Application status |
| `rating` | integer | Yes | - | Overall rating (1-5) |
| `notes` | text | Yes | - | Internal notes |
| `source` | text | Yes | - | Application source |
| `applied_at` | timestamptz | No | `now()` | Application timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `interviews`

Interview scheduling.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `application_id` | uuid | No | - | FK to job_applications |
| `round` | integer | No | `1` | Interview round |
| `type` | text | No | `'technical'` | Interview type |
| `scheduled_at` | timestamptz | No | - | Scheduled datetime |
| `duration` | integer | Yes | `60` | Duration in minutes |
| `location` | text | Yes | - | Location/meeting link |
| `interviewer_ids` | jsonb | Yes | `'[]'` | Interviewer IDs |
| `status` | text | No | `'scheduled'` | Interview status |
| `feedback` | jsonb | Yes | `'{}'` | Interviewer feedback |
| `rating` | integer | Yes | - | Overall rating (1-5) |
| `recommendation` | text | Yes | - | Recommendation |
| `notes` | text | Yes | - | Notes |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `application_stage_history`

Application stage changes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `application_id` | uuid | No | - | FK to job_applications |
| `from_stage` | text | Yes | - | Previous stage |
| `to_stage` | text | No | - | New stage |
| `notes` | text | Yes | - | Change notes |
| `updated_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

### Onboarding/Offboarding Tables

#### `onboarding_templates`

Onboarding checklist templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Template name |
| `description` | text | Yes | - | Description |
| `tasks` | jsonb | No | `'[]'` | Task checklist |
| `duration_days` | integer | Yes | `30` | Duration in days |
| `is_default` | boolean | Yes | `false` | Default template |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `onboarding_processes`

Active onboarding processes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `template_id` | uuid | Yes | - | FK to onboarding_templates |
| `start_date` | date | No | - | Start date |
| `expected_end_date` | date | Yes | - | Expected end date |
| `actual_end_date` | date | Yes | - | Actual end date |
| `tasks` | jsonb | No | `'[]'` | Task progress |
| `status` | text | No | `'in_progress'` | Process status |
| `assigned_to` | uuid | Yes | - | FK to employees (buddy) |
| `notes` | text | Yes | - | Notes |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `offboarding_processes`

Active offboarding processes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `exit_type` | text | No | - | Exit type (resignation, termination) |
| `last_working_date` | date | No | - | Last working date |
| `resignation_date` | date | Yes | - | Resignation date |
| `notice_period_days` | integer | Yes | `30` | Notice period |
| `reason` | text | Yes | - | Exit reason |
| `tasks` | jsonb | Yes | `'[]'` | Clearance tasks |
| `status` | text | No | `'initiated'` | Process status |
| `initiated_by` | uuid | Yes | - | FK to employees |
| `notes` | text | Yes | - | Notes |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `exit_interviews`

Exit interview records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `offboarding_id` | uuid | No | - | FK to offboarding_processes |
| `interview_date` | date | Yes | - | Interview date |
| `conducted_by` | uuid | Yes | - | FK to employees |
| `reason_for_leaving` | text | Yes | - | Primary reason |
| `feedback` | jsonb | Yes | `'{}'` | Detailed feedback |
| `overall_rating` | integer | Yes | - | Rating (1-5) |
| `would_recommend` | boolean | Yes | - | Would recommend company |
| `would_rejoin` | boolean | Yes | - | Would rejoin |
| `suggestions` | text | Yes | - | Suggestions |
| `status` | text | No | `'pending'` | Interview status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `fnf_settlements`

Full & Final settlement calculations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `offboarding_id` | uuid | No | - | FK to offboarding_processes |
| `pending_salary_days` | integer | Yes | `0` | Days of pending salary |
| `pending_salary_amount` | numeric | Yes | `0` | Pending salary |
| `leave_encashment_days` | integer | Yes | `0` | Encashable leave days |
| `leave_encashment_amount` | numeric | Yes | `0` | Leave encashment |
| `gratuity_amount` | numeric | Yes | `0` | Gratuity |
| `bonus_amount` | numeric | Yes | `0` | Bonus |
| `other_earnings` | numeric | Yes | `0` | Other earnings |
| `other_earnings_notes` | text | Yes | - | Notes |
| `notice_period_deduction` | numeric | Yes | `0` | Notice period deduction |
| `advance_deduction` | numeric | Yes | `0` | Advance recovery |
| `loan_deduction` | numeric | Yes | `0` | Loan recovery |
| `other_deductions` | numeric | Yes | `0` | Other deductions |
| `other_deductions_notes` | text | Yes | - | Notes |
| `total_earnings` | numeric | Yes | `0` | Total earnings |
| `total_deductions` | numeric | Yes | `0` | Total deductions |
| `final_amount` | numeric | Yes | `0` | Net payable |
| `status` | text | No | `'pending'` | Settlement status |
| `processed_by` | uuid | Yes | - | FK to employees |
| `processed_at` | timestamptz | Yes | - | Processing timestamp |
| `payment_date` | date | Yes | - | Payment date |
| `payment_reference` | text | Yes | - | Payment reference |
| `notes` | text | Yes | - | Notes |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Location Tables

#### `stores`

Office/store/branch locations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Location name |
| `code` | text | No | - | Location code |
| `type` | text | No | `'office'` | Type (office/store/warehouse) |
| `address` | text | Yes | - | Street address |
| `city` | text | Yes | - | City |
| `state` | text | Yes | - | State |
| `country` | text | Yes | - | Country |
| `zip_code` | text | Yes | - | ZIP code |
| `phone` | text | Yes | - | Phone number |
| `email` | text | Yes | - | Email |
| `manager_id` | uuid | Yes | - | FK to employees |
| `is_headquarters` | boolean | Yes | `false` | HQ flag |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `employee_store_assignments`

Employee-location assignments.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `store_id` | uuid | No | - | FK to stores |
| `start_date` | date | No | `CURRENT_DATE` | Start date |
| `end_date` | date | Yes | - | End date |
| `is_primary` | boolean | Yes | `false` | Primary location |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `employee_transfers`

Inter-location transfers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `from_store_id` | uuid | Yes | - | FK to stores (from) |
| `to_store_id` | uuid | No | - | FK to stores (to) |
| `transfer_date` | date | No | `CURRENT_DATE` | Transfer date |
| `effective_date` | date | No | - | Effective date |
| `reason` | text | Yes | - | Transfer reason |
| `status` | text | No | `'completed'` | Transfer status |
| `notes` | text | Yes | - | Notes |
| `initiated_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Template Tables

#### `email_templates`

Email template definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Template name |
| `type` | text | No | - | Template type |
| `subject` | text | No | - | Email subject |
| `content` | text | No | - | Email body (HTML) |
| `placeholders` | jsonb | Yes | `'[]'` | Available placeholders |
| `is_default` | boolean | Yes | `false` | Default template |
| `is_active` | boolean | Yes | `true` | Active status |
| `version` | integer | Yes | `1` | Template version |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | Yes | `now()` | Created timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Updated timestamp |

---

#### `letter_templates`

HR letter templates (offer, experience, relieving).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Template name |
| `type` | text | No | - | Letter type |
| `content` | text | No | - | Letter content (HTML) |
| `placeholders` | jsonb | Yes | `'[]'` | Available placeholders |
| `is_default` | boolean | Yes | `false` | Default template |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `payslip_templates`

Payslip format templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Template name |
| `layout` | jsonb | No | `'{}'` | Layout configuration |
| `earnings_components` | jsonb | Yes | `'[]'` | Earnings to show |
| `deductions_components` | jsonb | Yes | `'[]'` | Deductions to show |
| `show_ytd` | boolean | Yes | `true` | Show YTD values |
| `is_default` | boolean | Yes | `false` | Default template |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `announcement_templates`

Announcement templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Template name |
| `title` | text | No | - | Announcement title |
| `content` | text | No | - | Announcement content |
| `type` | text | No | `'general'` | Announcement type |
| `priority` | text | No | `'medium'` | Priority level |
| `target_audience` | text | No | `'all'` | Target audience |
| `is_default` | boolean | Yes | `false` | Default template |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `announcement_banner_templates`

Banner/alert templates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Template name |
| `html_content` | text | No | - | Banner HTML |
| `priority_type` | text | No | `'all'` | Priority type |
| `is_default` | boolean | Yes | `false` | Default template |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Communication Tables

#### `announcements`

Company announcements.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `title` | text | No | - | Announcement title |
| `content` | text | No | - | Announcement content |
| `type` | text | No | `'general'` | Type (general/urgent/event) |
| `priority` | text | No | `'medium'` | Priority (low/medium/high) |
| `target_audience` | text | No | `'all'` | Target (all/department/role) |
| `banner_template_id` | uuid | Yes | - | FK to banner_templates |
| `scheduled_at` | timestamptz | Yes | - | Scheduled publish time |
| `published_at` | timestamptz | No | `now()` | Published timestamp |
| `expires_at` | timestamptz | Yes | - | Expiry timestamp |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_by` | uuid | No | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

#### `notifications`

In-app notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `user_id` | uuid | No | - | Recipient user ID |
| `title` | text | No | - | Notification title |
| `message` | text | No | - | Notification message |
| `type` | text | No | `'info'` | Type (info/success/warning/error) |
| `link` | text | Yes | - | Action link |
| `is_read` | boolean | Yes | `false` | Read status |
| `read_at` | timestamptz | Yes | - | Read timestamp |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

#### `notification_settings`

User notification preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `user_id` | uuid | No | - | User ID |
| `email_notifications` | boolean | Yes | `true` | Email notifications |
| `push_notifications` | boolean | Yes | `true` | Push notifications |
| `leave_notifications` | boolean | Yes | `true` | Leave updates |
| `attendance_notifications` | boolean | Yes | `true` | Attendance updates |
| `announcement_notifications` | boolean | Yes | `true` | Announcements |
| `payroll_notifications` | boolean | Yes | `true` | Payroll updates |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Document Tables

#### `documents`

Document storage and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Document name |
| `type` | text | No | - | Document type |
| `document_category` | text | Yes | `'employee_doc'` | Category |
| `file_url` | text | Yes | - | File URL |
| `file_size` | integer | Yes | - | File size in bytes |
| `folder_path` | text | Yes | - | Virtual folder path |
| `employee_id` | uuid | Yes | - | FK to employees |
| `is_company_document` | boolean | Yes | `false` | Company document |
| `uploaded_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

#### `generated_letters`

Generated HR letters (offer, experience, etc.).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `employee_id` | uuid | No | - | FK to employees |
| `template_id` | uuid | Yes | - | FK to letter_templates |
| `type` | text | No | - | Letter type |
| `content` | text | No | - | Generated content |
| `file_url` | text | Yes | - | PDF file URL |
| `metadata` | jsonb | Yes | `'{}'` | Additional data |
| `status` | text | Yes | `'generated'` | Status |
| `generated_by` | uuid | Yes | - | FK to employees |
| `generated_at` | timestamptz | Yes | - | Generation timestamp |
| `created_at` | timestamptz | Yes | `now()` | Created timestamp |

---

### Invoice Tables

#### `invoice_categories`

Internal invoice categories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Category name |
| `code` | text | No | - | Category code |
| `description` | text | Yes | - | Description |
| `is_active` | boolean | Yes | `true` | Active status |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `internal_invoices`

Internal billing invoices.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `invoice_number` | text | No | - | Invoice number |
| `title` | text | No | - | Invoice title |
| `category_id` | uuid | Yes | - | FK to invoice_categories |
| `from_department_id` | uuid | Yes | - | FK to departments (from) |
| `to_department_id` | uuid | Yes | - | FK to departments (to) |
| `amount` | numeric | No | `0` | Invoice amount |
| `tax_amount` | numeric | Yes | `0` | Tax amount |
| `total_amount` | numeric | No | `0` | Total amount |
| `description` | text | Yes | - | Description |
| `line_items` | jsonb | Yes | `'[]'` | Line items |
| `due_date` | date | Yes | - | Due date |
| `status` | text | No | `'draft'` | Invoice status |
| `issued_at` | timestamptz | Yes | - | Issue timestamp |
| `paid_at` | timestamptz | Yes | - | Payment timestamp |
| `created_by` | uuid | Yes | - | FK to employees |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

### Other Tables

#### `holidays`

Company holiday calendar.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `name` | text | No | - | Holiday name |
| `date` | date | No | - | Holiday date |
| `type` | text | Yes | `'national'` | Holiday type |
| `is_optional` | boolean | Yes | `false` | Optional holiday |
| `description` | text | Yes | - | Description |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `audit_logs`

System audit trail.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | Yes | - | FK to companies |
| `module` | text | No | - | Module name |
| `action` | text | No | - | Action performed |
| `description` | text | No | - | Action description |
| `performed_by` | uuid | Yes | - | User who performed |
| `performer_name` | text | Yes | - | Performer name |
| `metadata` | jsonb | Yes | `'{}'` | Additional metadata |
| `ip_address` | text | Yes | - | IP address |
| `created_at` | timestamptz | Yes | `now()` | Created timestamp |

**Note:** This table is append-only (no UPDATE/DELETE allowed).

---

#### `company_settings`

Company-specific settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies (unique) |
| `attendance_settings` | jsonb | Yes | `'{}'` | Attendance config |
| `leave_settings` | jsonb | Yes | `'{}'` | Leave config |
| `payroll_settings` | jsonb | Yes | `'{}'` | Payroll config |
| `notification_settings` | jsonb | Yes | `'{}'` | Notification config |
| `email_settings` | jsonb | Yes | `'{}'` | Email config |
| `created_at` | timestamptz | No | `now()` | Created timestamp |
| `updated_at` | timestamptz | No | `now()` | Updated timestamp |

---

#### `status_page_subscriptions`

Public status page subscribers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `email` | text | No | - | Subscriber email |
| `is_verified` | boolean | Yes | `false` | Email verified |
| `verification_token` | text | Yes | - | Verification token |
| `unsubscribe_token` | text | Yes | - | Unsubscribe token |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

#### `status_history`

System status history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `company_id` | uuid | No | - | FK to companies |
| `service_name` | text | No | - | Service name |
| `status` | text | No | - | Status (operational/degraded/outage) |
| `message` | text | Yes | - | Status message |
| `created_at` | timestamptz | No | `now()` | Created timestamp |

---

## ⚙️ Database Functions

### Authentication & Authorization

```sql
-- Check if user is super admin
is_super_admin(user_id uuid) RETURNS boolean

-- Get user's company ID
get_user_company_id(user_id uuid) RETURNS uuid

-- Check if user has specific role
has_role(user_id uuid, role app_role) RETURNS boolean

-- Get user's permissions JSON
get_user_permissions(user_id uuid) RETURNS jsonb

-- Check module permission
has_module_permission(user_id uuid, module text, action text) RETURNS boolean

-- Check if user can access company
can_access_company(user_id uuid, target_company_id uuid) RETURNS boolean
```

### Utility Functions

```sql
-- Update updated_at timestamp (trigger function)
update_updated_at_column() RETURNS trigger

-- Generate unique invoice number
generate_invoice_number(company_id uuid) RETURNS text

-- Calculate work hours
calculate_work_hours(check_in time, check_out time) RETURNS numeric
```

### Trigger Functions

```sql
-- Handle new user creation
handle_new_user() RETURNS trigger
-- Automatically creates profile and sets default role

-- Update department employee count
update_department_employee_count() RETURNS trigger
```

---

## 🔒 RLS Policies

### Policy Patterns

#### 1. Company-Scoped Access
Most tables use this pattern to ensure users only see data from their company:

```sql
CREATE POLICY "Users can view records in their company"
ON table_name FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));
```

#### 2. Super Admin Bypass
Super admins can access all company data:

```sql
CREATE POLICY "Super admins can manage all records"
ON table_name FOR ALL
USING (is_super_admin(auth.uid()));
```

#### 3. Admin/HR Full Access
Admins and HR have full CRUD within their company:

```sql
CREATE POLICY "Company admins can manage records"
ON table_name FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'))
);
```

#### 4. Employee Self-Access
Employees can manage their own records:

```sql
CREATE POLICY "Users can manage their own records"
ON table_name FOR ALL
USING (
  employee_id IN (
    SELECT id FROM employees 
    WHERE user_id = auth.uid()
  )
);
```

#### 5. Insert-Only (Audit Logs)
Audit logs are append-only:

```sql
-- No UPDATE or DELETE policies exist for audit_logs
CREATE POLICY "Authenticated users can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 📊 Entity Relationship Diagram

<presentation-mermaid>
erDiagram
    COMPANIES ||--o{ EMPLOYEES : has
    COMPANIES ||--o{ DEPARTMENTS : has
    COMPANIES ||--o{ DESIGNATIONS : has
    COMPANIES ||--o{ STORES : has
    COMPANIES ||--o{ ROLES : has
    
    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : records
    EMPLOYEES ||--o{ LEAVE_REQUESTS : requests
    EMPLOYEES ||--o{ EXPENSE_CLAIMS : submits
    EMPLOYEES ||--o{ HELPDESK_TICKETS : creates
    EMPLOYEES ||--o{ ASSET_ASSIGNMENTS : assigned
    
    DEPARTMENTS ||--o{ EMPLOYEES : contains
    DEPARTMENTS ||--o{ DESIGNATIONS : has
    
    STORES ||--o{ EMPLOYEES : works_at
    STORES ||--o{ ATTENDANCE_RECORDS : logged_at
    
    ASSETS ||--o{ ASSET_ASSIGNMENTS : assigned_via
    ASSETS ||--o{ ASSET_MAINTENANCE : has
    ASSET_CATEGORIES ||--o{ ASSETS : categorizes
    
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : type_of
    LEAVE_TYPES ||--o{ LEAVE_BALANCES : balance_for
    EMPLOYEES ||--o{ LEAVE_BALANCES : has
    
    SHIFTS ||--o{ SHIFT_ASSIGNMENTS : assigned_via
    EMPLOYEES ||--o{ SHIFT_ASSIGNMENTS : has
    
    JOB_OPENINGS ||--o{ JOB_APPLICATIONS : receives
    JOB_APPLICATIONS ||--o{ INTERVIEWS : scheduled
    
    EMPLOYEES ||--o{ ONBOARDING_PROCESSES : undergoes
    EMPLOYEES ||--o{ OFFBOARDING_PROCESSES : undergoes
    OFFBOARDING_PROCESSES ||--o{ EXIT_INTERVIEWS : has
    OFFBOARDING_PROCESSES ||--o{ FNF_SETTLEMENTS : has
    
    HELPDESK_TICKETS ||--o{ HELPDESK_TICKET_MESSAGES : contains
</presentation-mermaid>

---

## 📈 Indexes & Performance

### Key Indexes

| Table | Index | Columns | Type |
|-------|-------|---------|------|
| `employees` | `employees_company_id_idx` | `company_id` | btree |
| `employees` | `employees_user_id_idx` | `user_id` | btree |
| `employees` | `employees_status_idx` | `status` | btree |
| `attendance_records` | `attendance_employee_date_idx` | `employee_id, date` | unique |
| `attendance_records` | `attendance_date_idx` | `date` | btree |
| `leave_requests` | `leave_requests_employee_idx` | `employee_id` | btree |
| `leave_requests` | `leave_requests_status_idx` | `status` | btree |
| `assets` | `assets_status_idx` | `status` | btree |
| `assets` | `assets_assigned_to_idx` | `assigned_to` | btree |
| `audit_logs` | `audit_logs_company_created_idx` | `company_id, created_at` | btree |
| `audit_logs` | `audit_logs_module_idx` | `module` | btree |

### Performance Recommendations

1. **Pagination**: Always use `LIMIT` and `OFFSET` for list queries
2. **Date Range Filters**: Use indexes on date columns for time-based queries
3. **Company Filter**: Always filter by `company_id` first (RLS handles this)
4. **Avoid N+1**: Use joins instead of multiple queries
5. **JSON Queries**: Index JSONB fields if frequently searched

---

## 📋 Data Types & Enums

### Custom Types

```sql
-- Application role enum
CREATE TYPE app_role AS ENUM ('admin', 'hr', 'manager', 'employee');
```

### Status Values by Table

| Table | Column | Values |
|-------|--------|--------|
| `employees` | `status` | `active`, `inactive`, `on_leave`, `terminated` |
| `employees` | `employment_type` | `full-time`, `part-time`, `contract`, `intern` |
| `attendance_records` | `status` | `present`, `absent`, `late`, `half_day`, `holiday`, `leave` |
| `leave_requests` | `status` | `pending`, `approved`, `rejected`, `cancelled` |
| `expense_claims` | `status` | `pending`, `approved`, `rejected`, `reimbursed` |
| `helpdesk_tickets` | `status` | `open`, `in_progress`, `resolved`, `closed` |
| `helpdesk_tickets` | `priority` | `low`, `medium`, `high`, `urgent` |
| `assets` | `status` | `available`, `assigned`, `maintenance`, `retired` |
| `assets` | `condition` | `new`, `good`, `fair`, `poor` |
| `job_openings` | `status` | `draft`, `published`, `closed`, `on_hold` |
| `job_applications` | `stage` | `applied`, `screening`, `interview`, `offer`, `hired`, `rejected` |
| `payslips` | `status` | `draft`, `generated`, `sent`, `paid` |
| `onboarding_processes` | `status` | `not_started`, `in_progress`, `completed`, `cancelled` |
| `offboarding_processes` | `status` | `initiated`, `in_progress`, `completed`, `cancelled` |

---

## 📦 Storage Buckets

### Configured Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `documents` | ❌ | Employee documents, company documents |
| `company-assets` | ✅ | Logos, avatars, public assets |
| `recruitment-documents` | ❌ | Resumes, cover letters |

### Storage Policies

```sql
-- Users can upload to their folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔄 Migration Guide

### Adding a New Table

```sql
-- 1. Create table with company_id
CREATE TABLE public.new_table (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policies
CREATE POLICY "Users can view in their company"
ON public.new_table FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage"
ON public.new_table FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Super admins can manage all"
ON public.new_table FOR ALL
USING (is_super_admin(auth.uid()));

-- 4. Add indexes
CREATE INDEX new_table_company_id_idx ON public.new_table(company_id);

-- 5. Add updated_at trigger
CREATE TRIGGER update_new_table_updated_at
BEFORE UPDATE ON public.new_table
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Modifying Existing Tables

```sql
-- Add column
ALTER TABLE public.employees ADD COLUMN middle_name text;

-- Add index
CREATE INDEX employees_email_idx ON public.employees(email);

-- Modify RLS policy
DROP POLICY IF EXISTS "old_policy_name" ON public.table_name;
CREATE POLICY "new_policy_name" ON public.table_name ...;
```

---

## 📚 Additional Resources

- [Project README](./README.md) - Project overview and setup
- [API Documentation](./API_README.md) - Complete API reference
- [Supabase Documentation](https://supabase.com/docs) - Backend platform docs

---

<div align="center">
  <p>© 2024 HRMS. All rights reserved.</p>
</div>
