# HRMS API Documentation

## Overview

This document describes all available API endpoints for the HRMS system. All endpoints are Supabase Edge Functions.

## Base URL

```
https://gdfaemouuvmovtsecgif.supabase.co/functions/v1/
```

## Authentication

Most endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <token>
```

## Rate Limiting

All endpoints include rate limiting headers:
- `X-RateLimit-Limit`: 100 (requests per minute)
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp (Unix)

---

## Health & Monitoring

### `api-health`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Basic health check with all service statuses |
| GET | `/ready` | Readiness probe - checks database connection |
| GET | `/live` | Liveness probe - always returns 200 |
| GET | `/metrics` | Performance metrics (internal use) |
| GET | `/services` | Individual service status |

---

## Core Modules

### `api-employees`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all employees |
| GET | `/list` | Basic employee list (for dropdowns) |
| GET | `/current` | Get current authenticated employee |
| GET | `/role/:userId` | Get user role by user ID |
| GET | `/:id` | Get employee by ID |
| GET | `/:id/attendance` | Get employee's attendance |
| GET | `/:id/leaves` | Get employee's leaves |
| GET | `/search?q=&field=&limit=&offset=` | **NEW** Search employees |
| GET | `/export?status=&department_id=` | **NEW** Export employees data |
| POST | `/` | Create employee |
| POST | `/create-account` | Create employee with user account |
| POST | `/bulk` | Bulk create employees |
| POST | `/import` | Import employees from JSON |
| PUT | `/:id` | Update employee |
| PUT | `/current` | Update current employee's profile |
| PUT | `/bulk` | Bulk update employees |
| DELETE | `/:id` | Delete employee |

**Search Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| `q` | required | Search query |
| `field` | `first_name,last_name,email,employee_id` | Fields to search |
| `limit` | 20 | Max results |
| `offset` | 0 | Pagination offset |

### `api-attendance`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List attendance records (admin) |
| GET | `/today` | Get current user's attendance for today |
| GET | `/today/stats` | Get today's attendance stats (admin) |
| GET | `/my` | Get current user's attendance records |
| GET | `/employee/:id` | Get specific employee's attendance |
| POST | `/` | Create attendance record (admin) |
| POST | `/clock-in` | Clock in (preferred) |
| POST | `/check-in` | Clock in (legacy alias) |
| POST | `/clock-out` | Clock out (preferred) |
| POST | `/check-out` | Clock out (legacy alias) |
| PUT | `/:id` | Update attendance record |

### `api-attendance-regularization`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List regularization requests |
| GET | `/my` | Get current user's requests |
| GET | `/:id` | Get request by ID |
| POST | `/` | Create regularization request |
| PUT | `/:id` | Update request (approve/reject) |

### `api-leaves`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/types` | List leave types |
| GET | `/balances` | Get current user's leave balance |
| GET | `/balances/:employeeId` | Get employee's leave balance (admin) |
| GET | `/my` | Get current user's leave requests |
| GET | `/requests` | **UPDATED** List all requests with filters |
| GET | `/requests/pending` | **DEPRECATED** Use `/requests?status=pending` |
| GET | `/requests/employee/:id` | Get employee's requests (admin) |
| GET | `/search?q=&limit=` | **NEW** Search leave requests |
| GET | `/export?status=&date_from=&date_to=` | **NEW** Export leave data |
| POST | `/` | Create leave request |
| PUT | `/:id` | Update leave (approve/reject) |
| DELETE | `/:id` | Cancel leave request |

**Request Filters (GET /requests):**
| Param | Description |
|-------|-------------|
| `status` | pending, approved, rejected |
| `employee_id` | Filter by employee |
| `date_from` | Start date filter |
| `date_to` | End date filter |
| `limit` | Max results (default: 1000) |
| `offset` | Pagination offset |

### `api-shifts`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all shifts |
| GET | `/my` | Get current user's shift assignments |
| GET | `/:id` | Get shift by ID |
| POST | `/` | Create shift |
| PUT | `/:id` | Update shift |
| DELETE | `/:id` | Delete shift |
| GET | `/assignments` | List shift assignments |
| POST | `/assignments` | Create assignment |
| PUT | `/assignments/:id` | Update assignment |
| GET | `/rotations` | List shift rotations |
| POST | `/rotations` | Create rotation |
| PUT | `/rotations/:id` | Update rotation |
| GET | `/exchange` | List exchange requests |
| POST | `/exchange` | Create exchange request |
| PUT | `/exchange/:id` | Update exchange (approve/reject) |

### `api-payroll`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List payroll records |
| GET | `/my` | Get current user's payslips |
| GET | `/structures` | List salary structures |
| POST | `/structures` | Create salary structure |
| PUT | `/structures/:id` | Update salary structure |
| POST | `/generate` | Generate payslips |

### `api-assets`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all assets (with filters) |
| GET | `/my` | Get current user's assigned assets |
| GET | `/:id` | Get asset by ID |
| GET | `/stats` | Get asset statistics |
| GET | `/search?q=&field=&limit=&offset=` | **NEW** Search assets |
| GET | `/export?status=&category_id=` | **NEW** Export assets data |
| POST | `/` | Create asset |
| PUT | `/:id` | Update asset |
| DELETE | `/:id` | Delete asset |
| GET | `/categories` | List asset categories |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |
| GET | `/assignments` | List asset assignments |
| POST | `/assign` | Assign asset to employee |
| POST | `/unassign` | Return/unassign asset |
| POST | `/transfer` | Transfer asset to location |
| GET | `/maintenance` | List maintenance records |
| POST | `/maintenance` | Create maintenance record |
| PUT | `/maintenance/:id` | Update maintenance |
| GET | `/maintenance-requests` | List maintenance requests |
| GET | `/maintenance-requests/my` | Get my maintenance requests |
| POST | `/maintenance-requests` | Create request |
| PUT | `/maintenance-requests/:id` | Update request |
| GET | `/transfers` | List asset transfers |

**Asset List Filters (GET /):**
| Param | Description |
|-------|-------------|
| `status` | available, assigned, maintenance, retired |
| `category_id` | Filter by category |
| `location_id` | Filter by location |
| `search` | Search in name, tag, serial |
| `limit` | Max results |
| `offset` | Pagination offset |

**Search Parameters (GET /search):**
| Param | Default | Description |
|-------|---------|-------------|
| `q` | required | Search query |
| `field` | `name,asset_tag,serial_number,brand,model` | Fields to search |
| `limit` | 20 | Max results |
| `offset` | 0 | Pagination offset |

### `api-documents`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all documents |
| GET | `/my` | Get current user's documents |
| GET | `/:id` | Get document by ID |
| POST | `/` | Upload document |
| PUT | `/:id` | Update document |
| DELETE | `/:id` | Delete document |

### `api-expenses`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all expense claims |
| GET | `/my` | Get current user's expenses |
| GET | `/:id` | Get expense by ID |
| POST | `/` | Create expense claim |
| PUT | `/:id` | Update expense (approve/reject) |
| DELETE | `/:id` | Cancel expense |
| GET | `/categories` | List expense categories |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| GET | `/policies` | List expense policies |
| POST | `/policies` | Create policy |

### `api-helpdesk`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all tickets |
| GET | `/employee/:id` | Get employee's tickets |
| GET | `/:id` | Get ticket by ID |
| POST | `/` | Create ticket |
| PATCH | `/:id` | Update ticket |
| DELETE | `/:id` | Delete ticket |
| GET | `/:ticketId/messages` | Get ticket messages |
| POST | `/:ticketId/messages` | Send message |

---

## Organization Management

### `api-departments`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all departments |
| GET | `/:id` | Get department by ID |
| POST | `/` | Create department |
| PUT | `/:id` | Update department |
| DELETE | `/:id` | Delete department |

### `api-designations`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all designations |
| GET | `/:id` | Get designation by ID |
| POST | `/` | Create designation |
| PUT | `/:id` | Update designation |
| DELETE | `/:id` | Delete designation |

### `api-stores`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all locations (offices/stores) |
| GET | `/:id` | Get location by ID |
| POST | `/` | Create location |
| PUT | `/:id` | Update location |
| DELETE | `/:id` | Delete location |
| GET | `/transfers` | List employee transfers |
| POST | `/transfers` | Create transfer |
| PUT | `/transfers/:id` | Update transfer |

---

## Recruitment & Onboarding

### `api-recruitment`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/jobs` | List job openings |
| GET | `/jobs/:id` | Get job by ID |
| POST | `/jobs` | Create job opening |
| PUT | `/jobs/:id` | Update job |
| DELETE | `/jobs/:id` | Delete job |
| GET | `/applications` | List applications |
| GET | `/applications/:id` | Get application by ID |
| POST | `/applications` | Create application |
| PUT | `/applications/:id` | Update application |
| GET | `/interviews` | List interviews |
| POST | `/interviews` | Schedule interview |
| PUT | `/interviews/:id` | Update interview |
| GET | `/stats` | Get recruitment stats |

### `api-onboarding`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List onboarding processes |
| GET | `/:id` | Get onboarding by ID |
| POST | `/` | Start onboarding |
| PUT | `/:id` | Update onboarding |
| GET | `/templates` | List templates |
| POST | `/templates` | Create template |

### `api-offboarding`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List offboarding processes |
| GET | `/:id` | Get offboarding by ID |
| POST | `/` | Initiate offboarding |
| PUT | `/:id` | Update offboarding |
| GET | `/exit-interviews` | List exit interviews |
| POST | `/exit-interviews` | Create exit interview |
| PUT | `/exit-interviews/:id` | Update interview |
| GET | `/fnf` | List F&F settlements |
| POST | `/fnf` | Create settlement |
| PUT | `/fnf/:id` | Update settlement |

---

## Templates & Communications

### `api-announcements`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List announcements |
| GET | `/active` | Get active announcements |
| POST | `/` | Create announcement |
| PUT | `/:id` | Update announcement |
| DELETE | `/:id` | Delete announcement |
| GET | `/banners` | Get active banners |

### `api-notifications`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| GET | `/unread` | Get unread count |
| PUT | `/:id/read` | Mark as read |
| PUT | `/read-all` | Mark all as read |
| POST | `/send` | Send notification |
| POST | `/send-targeted` | Send targeted notification |

### `api-templates`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/email` | List email templates |
| POST | `/email` | Create email template |
| PUT | `/email/:id` | Update template |
| DELETE | `/email/:id` | Delete template |
| GET | `/letter` | List letter templates |
| POST | `/letter` | Create letter template |
| PUT | `/letter/:id` | Update template |
| DELETE | `/letter/:id` | Delete template |
| GET | `/payslip` | List payslip templates |
| POST | `/payslip` | Create payslip template |
| GET | `/announcement` | List announcement templates |
| POST | `/announcement` | Create template |
| GET | `/banner` | List banner templates |
| POST | `/banner` | Create template |

---

## Internal Billing

### `api-internal-invoices`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List invoices |
| GET | `/:id` | Get invoice by ID |
| POST | `/` | Create invoice |
| PUT | `/:id` | Update invoice |
| DELETE | `/:id` | Delete invoice |
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |

---

## Utilities

### `api-holidays`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List holidays |
| POST | `/` | Create holiday |
| PUT | `/:id` | Update holiday |
| DELETE | `/:id` | Delete holiday |

### `api-audit`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List audit logs (with filters) |
| POST | `/` | Create audit log entry |
| GET | `/:module` | Get logs by module |

### `api-settings`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/company` | Get company settings |
| PUT | `/company` | Update company settings |
| GET | `/branding` | Get branding settings |
| PUT | `/branding` | Update branding |
| GET | `/public/branding` | Public branding (no auth) |
| GET | `/roles` | List roles |
| POST | `/roles` | Create role |
| PUT | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete role |
| GET | `/system` | Get system settings |
| PUT | `/system` | Update system settings |

### `api-search`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/?q=term` | Global search across all modules |
| GET | `/employees?q=term` | Search employees only |

### `api-dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Get dashboard statistics |
| GET | `/birthdays` | Get upcoming birthdays |
| GET | `/events` | Get upcoming events |
| GET | `/attendance-feed` | Get live attendance feed |

---

## Super Admin

### `api-super-admin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Platform statistics |
| GET | `/companies` | List all companies |
| GET | `/companies/:id` | Get company details |
| GET | `/companies/:id/stats` | Get company stats |
| GET | `/companies/:id/admins` | Get company admins |
| GET | `/companies/:id/employees` | Get company employees |
| POST | `/companies` | Create company |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |
| GET | `/super-admins` | List super admins |
| POST | `/super-admins` | Create super admin |
| DELETE | `/super-admins/:id` | Remove super admin |
| GET | `/audit-logs` | Platform audit logs |

---

## Standardized Patterns

### Current User Data

| Pattern | Usage |
|---------|-------|
| `/current` | Get single record for current user |
| `/my` | Get list of records for current user |

### Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `status` | `?status=pending` | Filter by status |
| `limit` | `?limit=20` | Items per page |
| `offset` | `?offset=40` | Skip records |
| `q` | `?q=search term` | Search query |
| `field` | `?field=name,email` | Fields to search |

### Response Format

**Success:**
```json
{
  "data": [...],
  "total": 100
}
```

**Search/Export:**
```json
{
  "data": [...],
  "query": "search term",
  "total": 25,
  "exported_at": "2024-01-15T10:30:00Z"
}
```

**Bulk Operations:**
```json
{
  "total": 10,
  "success_count": 8,
  "failed_count": 2,
  "results": {
    "success": [...],
    "failed": [{ "data": {...}, "error": "Error message" }]
  }
}
```

### Error Response

```json
{
  "error": "Error message"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 207 | Multi-Status (partial success in bulk) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Server Error |

---

## Changelog

### Latest Updates
- Added `/search` endpoints to employees, leaves, and assets APIs
- Added `/export` endpoints for data export
- Added rate limiting headers to all responses
- Deprecated `/requests/pending` in favor of `/requests?status=pending`
- Added pagination support (`limit`, `offset`) to list endpoints
