# HRMS Project - Node.js Backend + MySQL Migration

## What's Been Created

### 1. Database (`database/`)
- **schema.sql** - Complete MySQL schema with 29 tables
- **seed.sql** - Sample data with default users
- **README.md** - Database setup instructions

### 2. Backend (`backend/`)
- **Express server** with CORS, error handling
- **MySQL connection** pool configuration
- **JWT authentication** with access/refresh tokens
- **Role-based middleware** (admin, HR, manager, employee)
- **15+ API route files** for all modules

### 3. Frontend Updates (`src/`)
- **src/lib/api.ts** - REST API client replacing Supabase
- **src/contexts/AuthContext.tsx** - JWT-based authentication
- **Updated hooks**: useEmployees, useAttendance, useLeaves, useDashboard, useNotifications, useAnnouncements, useHolidays, useShifts, usePayroll, useHelpdesk, useCurrentEmployee

## Setup Instructions

### 1. Download Project
Connect to GitHub and clone the repository.

### 2. Setup MySQL
```bash
mysql -u root -p
CREATE DATABASE hrms;
USE hrms;
SOURCE database/schema.sql;
SOURCE database/seed.sql;  # Optional sample data
```

### 3. Run Backend
```bash
cd backend
cp .env.example .env  # Edit with your MySQL credentials
npm install
npm run dev  # http://localhost:3001
```

### 4. Run Frontend
```bash
# Create .env in project root
echo "VITE_API_URL=http://localhost:3001/api" > .env
npm install
npm run dev  # http://localhost:5173
```

## Default Login
| Email | Password | Role |
|-------|----------|------|
| admin@hrms.com | Admin@123 | Admin |

## Remaining Work
Some hooks still need to be updated to use the REST API:
- useDocuments, useAuditLogs, useShiftExchange
- useLetterTemplates, useEmailTemplates, useBannerTemplates
- useAnnouncementTemplates, usePayslipTemplates

The backend route stubs exist - you may need to expand controller logic as needed.
