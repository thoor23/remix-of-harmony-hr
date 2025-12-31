# HRMS (Human Resource Management System)

A comprehensive, multi-tenant Human Resource Management System built with React, TypeScript, and Supabase.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [User Roles](#user-roles)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Authentication](#authentication)
10. [Setup & Installation](#setup--installation)
11. [Environment Variables](#environment-variables)
12. [Deployment](#deployment)

---

## Overview

This HRMS is a full-featured enterprise HR solution supporting:

- **Multi-tenancy**: Multiple companies with isolated data
- **Role-based Access Control**: Super Admin, Admin, HR, Employee roles
- **Complete HR Modules**: Attendance, Leaves, Payroll, Recruitment, Assets, and more
- **Real-time Updates**: Live attendance feeds and notifications
- **Customizable**: Company branding, templates, and settings

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component Library |
| React Router v6 | Routing |
| TanStack Query | Data Fetching & Caching |
| React Hook Form | Form Management |
| Zod | Validation |
| Recharts | Charts & Analytics |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Backend as a Service |
| PostgreSQL | Database |
| Deno Edge Functions | Serverless API |
| Row Level Security | Data Isolation |

---

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── layout/          # Layout components (Sidebar, TopBar)
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── shared/          # Shared components (Tables, Forms)
│   │   └── [module]/        # Module-specific components
│   │
│   ├── pages/               # Route pages
│   │   ├── admin/           # Admin panel pages
│   │   ├── employee/        # Employee self-service pages
│   │   ├── super-admin/     # Super admin pages
│   │   └── public/          # Public pages (Careers, Status)
│   │
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React Context providers
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── data/                # Static data & mock data
│   └── integrations/        # External integrations
│
├── supabase/
│   ├── functions/           # Edge Functions (APIs)
│   │   ├── _shared/         # Shared utilities (auth, cors)
│   │   └── api-*/           # Individual API endpoints
│   └── config.toml          # Supabase configuration
│
└── database/                # SQL schema files
```

---

## User Roles

### Super Admin
- Manage all companies on the platform
- View platform-wide analytics
- Create/manage company admins
- Access audit logs across companies

### Admin
- Full access to company HR modules
- Manage employees, departments, designations
- Approve leaves, expenses, requests
- Configure company settings

### HR
- Similar to Admin but focused on HR operations
- Manage recruitment, onboarding, offboarding
- Handle employee relations

### Employee
- Self-service portal
- View/request leaves
- Clock in/out attendance
- View payslips and documents

---

## Frontend Architecture

### Pages Structure

#### Admin Pages (`/admin/*`)
| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Overview with stats and widgets |
| `/admin/employees` | EmployeeList | Manage all employees |
| `/admin/employees/add` | AddEmployee | Create new employee |
| `/admin/employees/:id` | EmployeeDetails | View employee profile |
| `/admin/attendance` | AttendanceManagement | Track attendance |
| `/admin/leaves` | LeaveManagement | Manage leave requests |
| `/admin/payroll` | PayslipsList | Payroll management |
| `/admin/assets` | AssetList | Asset inventory |
| `/admin/recruitment` | RecruitmentDashboard | Hiring pipeline |
| `/admin/helpdesk` | HelpdeskManagement | Support tickets |
| `/admin/reports/*` | Reports | Analytics & reports |
| `/admin/settings/*` | Settings | System configuration |

#### Employee Pages (`/employee/*`)
| Route | Page | Description |
|-------|------|-------------|
| `/employee` | Dashboard | Personal dashboard |
| `/employee/attendance` | Attendance | View own attendance |
| `/employee/leaves` | Leaves | Request/view leaves |
| `/employee/payslips` | Payslips | View payslips |
| `/employee/assets` | Assets | View assigned assets |
| `/employee/helpdesk` | Helpdesk | Submit tickets |
| `/employee/profile` | Profile | Edit profile |

#### Super Admin Pages (`/super-admin/*`)
| Route | Page | Description |
|-------|------|-------------|
| `/super-admin` | Dashboard | Platform overview |
| `/super-admin/companies` | CompanyList | Manage companies |
| `/super-admin/companies/add` | AddCompany | Create company |
| `/super-admin/users` | SuperAdminUsers | Manage super admins |
| `/super-admin/analytics` | PlatformAnalytics | Platform metrics |
| `/super-admin/settings` | GlobalSettings | Platform settings |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useEmployees` | CRUD operations for employees |
| `useAttendance` | Attendance management |
| `useLeaves` | Leave requests & balances |
| `usePayroll` | Payroll & payslips |
| `useAssets` | Asset management |
| `useHelpdesk` | Support ticket system |
| `useAnnouncements` | Company announcements |
| `useNotifications` | User notifications |
| `useAuditLogs` | Activity logging |
| `useSuperAdmin` | Super admin operations |
| `useCurrentEmployee` | Current user's employee data |
| `useCompanyBranding` | Company customization |

### Context Providers

| Context | Purpose |
|---------|---------|
| `AuthContext` | Authentication state & methods |
| `PermissionContext` | Role-based access control |
| `ThemeContext` | Dark/light mode theming |

---

## Backend Architecture

### Edge Functions

All API endpoints are implemented as Supabase Edge Functions:

#### Core APIs
| Function | Endpoint | Description |
|----------|----------|-------------|
| `api-auth` | `/api-auth/*` | Authentication & session |
| `api-employees` | `/api-employees/*` | Employee CRUD |
| `api-attendance` | `/api-attendance/*` | Attendance tracking |
| `api-leaves` | `/api-leaves/*` | Leave management |
| `api-payroll` | `/api-payroll/*` | Payroll operations |
| `api-assets` | `/api-assets/*` | Asset management |
| `api-helpdesk` | `/api-helpdesk/*` | Ticket system |

#### Supporting APIs
| Function | Endpoint | Description |
|----------|----------|-------------|
| `api-departments` | `/api-departments/*` | Departments |
| `api-designations` | `/api-designations/*` | Job titles |
| `api-announcements` | `/api-announcements/*` | Announcements |
| `api-documents` | `/api-documents/*` | Document storage |
| `api-notifications` | `/api-notifications/*` | Notifications |
| `api-settings` | `/api-settings/*` | System settings |
| `api-audit` | `/api-audit/*` | Audit logging |

#### Admin APIs
| Function | Endpoint | Description |
|----------|----------|-------------|
| `api-recruitment` | `/api-recruitment/*` | Hiring pipeline |
| `api-onboarding` | `/api-onboarding/*` | New hire onboarding |
| `api-offboarding` | `/api-offboarding/*` | Exit management |
| `api-expenses` | `/api-expenses/*` | Expense claims |
| `api-shifts` | `/api-shifts/*` | Shift scheduling |
| `api-templates` | `/api-templates/*` | Email/letter templates |

#### Platform APIs
| Function | Endpoint | Description |
|----------|----------|-------------|
| `api-super-admin` | `/api-super-admin/*` | Super admin operations |
| `api-health` | `/api-health/*` | System health checks |
| `api-search` | `/api-search/*` | Global search |

### Shared Utilities (`_shared/`)

| File | Purpose |
|------|---------|
| `auth.ts` | Authentication helpers, JWT validation |
| `cors.ts` | CORS headers, rate limiting |

---

## API Documentation

### Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```

### Common Response Format

**Success:**
```json
{
  "data": [...],
  "total": 100
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

### Rate Limiting

All endpoints include rate limiting headers:
- `X-RateLimit-Limit`: 100 (requests per minute)
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

### Key Endpoints

#### Employees API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-employees` | List all employees |
| GET | `/api-employees/:id` | Get employee by ID |
| GET | `/api-employees/current` | Get current user's employee |
| GET | `/api-employees/search?q=` | Search employees |
| GET | `/api-employees/export` | Export employees data |
| POST | `/api-employees` | Create employee |
| POST | `/api-employees/create-account` | Create employee with login |
| POST | `/api-employees/import` | Bulk import employees |
| PUT | `/api-employees/:id` | Update employee |
| DELETE | `/api-employees/:id` | Delete employee |

#### Leaves API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-leaves/types` | List leave types |
| GET | `/api-leaves/balances` | Get current user's balances |
| GET | `/api-leaves/my` | Get current user's requests |
| GET | `/api-leaves/requests?status=` | List requests (filterable) |
| GET | `/api-leaves/search?q=` | Search leave requests |
| GET | `/api-leaves/export` | Export leave data |
| POST | `/api-leaves` | Create leave request |
| PUT | `/api-leaves/:id` | Update/approve request |
| DELETE | `/api-leaves/:id` | Cancel request |

#### Attendance API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-attendance` | All attendance records |
| GET | `/api-attendance/today` | Current user's today |
| GET | `/api-attendance/today/stats` | Today's statistics |
| GET | `/api-attendance/my` | Current user's history |
| POST | `/api-attendance/clock-in` | Clock in |
| POST | `/api-attendance/clock-out` | Clock out |

#### Assets API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api-assets` | List all assets |
| GET | `/api-assets/my` | User's assigned assets |
| GET | `/api-assets/search?q=` | Search assets |
| GET | `/api-assets/export` | Export assets data |
| GET | `/api-assets/categories` | Asset categories |
| POST | `/api-assets` | Create asset |
| POST | `/api-assets/assign` | Assign to employee |
| POST | `/api-assets/unassign` | Unassign asset |

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `companies` | Company/tenant information |
| `users` | User accounts |
| `user_roles` | Role assignments |
| `roles` | Role definitions with permissions |
| `employees` | Employee profiles |
| `departments` | Company departments |
| `designations` | Job titles/positions |

### HR Tables

| Table | Description |
|-------|-------------|
| `attendance_records` | Daily attendance |
| `leave_types` | Types of leaves |
| `leave_balances` | Employee leave balances |
| `leave_requests` | Leave applications |
| `payslips` | Monthly payslips |
| `salary_structures` | Salary components |

### Asset Tables

| Table | Description |
|-------|-------------|
| `assets` | Asset inventory |
| `asset_categories` | Asset types |
| `asset_assignments` | Assignment history |
| `asset_maintenance` | Maintenance records |

### Other Tables

| Table | Description |
|-------|-------------|
| `announcements` | Company announcements |
| `helpdesk_tickets` | Support tickets |
| `documents` | Uploaded documents |
| `notifications` | User notifications |
| `audit_logs` | Activity audit trail |

---

## Authentication

### Login Flow

1. User submits email/password to `/api-auth/login`
2. Server validates credentials against `users` table
3. Server returns JWT tokens (access + refresh)
4. Client stores tokens in localStorage
5. All API requests include `Authorization: Bearer <token>`

### Token Refresh

- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Client automatically refreshes using `/api-auth/refresh`

### Permission System

Permissions are stored as JSON in the `roles` table:

```json
[
  { "module": "Employees", "create": true, "read": true, "update": true, "delete": false },
  { "module": "Leaves", "create": true, "read": true, "update": true, "delete": false }
]
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (for backend)

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd hrms

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Run the schema SQL from `database/schema.sql`
3. Run seed data from `database/seed.sql`
4. Configure environment variables

---

## Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

Edge function secrets (configured in Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

---

## Deployment

### Frontend

1. Click **Publish** in Lovable
2. Or build manually:
   ```bash
   npm run build
   ```
3. Deploy `dist/` folder to any static host

### Backend

Edge functions deploy automatically when code is pushed.

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed

---

## Module Details

### Attendance Management
- Clock in/out with timestamps
- Late detection (after 9:30 AM)
- Work hours calculation
- Monthly reports
- Regularization requests

### Leave Management
- Multiple leave types (Annual, Sick, Casual, etc.)
- Leave balance tracking
- Approval workflow
- Calendar integration
- Carry-forward support

### Payroll
- Salary structure configuration
- Payslip generation
- Tax calculations
- Bank details management
- Payslip templates

### Recruitment
- Job openings management
- Application tracking
- Interview scheduling
- Offer letter generation
- Onboarding workflow

### Asset Management
- Asset inventory
- Assignment tracking
- Maintenance scheduling
- Transfer between locations
- Depreciation tracking

### Helpdesk
- Ticket creation
- Category-based routing
- Internal notes
- Resolution tracking
- SLA monitoring

---

## Support

- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **API Reference**: See `API_README.md`
- **Database Schema**: See `database/README.md`

---

## License

Proprietary - All rights reserved
