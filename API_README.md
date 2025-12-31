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

---

## Health & Monitoring

### `api-health`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Basic health check |
| GET | `/ready` | Readiness probe - checks database connection |
| GET | `/live` | Liveness probe - always returns 200 |
| GET | `/metrics` | Performance metrics (internal use) |

---

## Core Modules

### `api-employees`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all employees |
| GET | `/me` | Get current authenticated employee |
| GET | `/current` | Alias for `/me` |
| GET | `/:id` | Get employee by ID |
| POST | `/` | Create employee |
| PUT | `/:id` | Update employee |
| DELETE | `/:id` | Delete employee |
| POST | `/bulk` | Bulk create employees |
| PUT | `/bulk` | Bulk update employees |
| POST | `/import` | Import employees from CSV/JSON |
| GET | `/export` | Export employees to CSV |

### `api-attendance`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List attendance records |
| GET | `/today` | Get current user's attendance for today |
| GET | `/my` | Get current user's attendance records |
| GET | `/:id` | Get attendance by ID |
| POST | `/` | Create attendance record |
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
| GET | `/` | List all leave requests |
| GET | `/my` | Get current user's leave requests |
| GET | `/balance` | Get current user's leave balance |
| GET | `/:id` | Get leave by ID |
| POST | `/` | Create leave request |
| PUT | `/:id` | Update leave (approve/reject) |
| DELETE | `/:id` | Cancel leave request |

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
| GET | `/` | List all assets |
| GET | `/my` | Get current user's assigned assets |
| GET | `/:id` | Get asset by ID |
| POST | `/` | Create asset |
| PUT | `/:id` | Update asset |
| DELETE | `/:id` | Delete asset |
| GET | `/categories` | List asset categories |
| POST | `/categories` | Create category |
| GET | `/assignments` | List asset assignments |
| POST | `/assignments` | Create assignment |
| PUT | `/assignments/:id` | Return asset |
| GET | `/maintenance` | List maintenance records |
| POST | `/maintenance` | Create maintenance record |
| GET | `/maintenance-requests` | List maintenance requests |
| POST | `/maintenance-requests` | Create request |
| PUT | `/maintenance-requests/:id` | Update request |
| GET | `/transfers` | List asset transfers |
| POST | `/transfers` | Create transfer |

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
| GET | `/policies` | List expense policies |

### `api-helpdesk`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all tickets |
| GET | `/my` | Get current user's tickets |
| GET | `/:id` | Get ticket by ID |
| POST | `/` | Create ticket |
| PUT | `/:id` | Update ticket |
| GET | `/:id/messages` | Get ticket messages |
| POST | `/:id/messages` | Send message |

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
| GET | `/applications` | List applications |
| GET | `/applications/:id` | Get application by ID |
| POST | `/applications` | Create application |
| PUT | `/applications/:id` | Update application |
| GET | `/interviews` | List interviews |
| POST | `/interviews` | Schedule interview |
| PUT | `/interviews/:id` | Update interview |

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

### `api-templates`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/email` | List email templates |
| POST | `/email` | Create email template |
| PUT | `/email/:id` | Update template |
| GET | `/letter` | List letter templates |
| POST | `/letter` | Create letter template |
| PUT | `/letter/:id` | Update template |
| GET | `/payslip` | List payslip templates |
| POST | `/payslip` | Create payslip template |
| GET | `/announcement` | List announcement templates |
| GET | `/banner` | List banner templates |

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
| GET | `/:module` | Get logs by module |

### `api-settings`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/company` | Get company settings |
| PUT | `/company` | Update company settings |
| GET | `/branding` | Get branding settings |
| PUT | `/branding` | Update branding |
| GET | `/roles` | List roles |
| POST | `/roles` | Create role |
| PUT | `/roles/:id` | Update role |

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

## Standardized Patterns

### Current User Data

| Pattern | Usage |
|---------|-------|
| `/me` | Get single record for current user |
| `/my` | Get list of records for current user |

### Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `status` | `?status=pending` | Filter by status |
| `page` | `?page=1` | Pagination page |
| `limit` | `?limit=20` | Items per page |
| `sort` | `?sort=created_at:desc` | Sort order |
| `q` | `?q=search term` | Search query |

### Response Format

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |
