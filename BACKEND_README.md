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
- **All hooks updated** to use REST API instead of Supabase

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

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/register | Create new user (admin/HR only) |
| GET | /api/auth/me | Get current user info |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List all employees |
| GET | /api/employees/current | Get current employee |
| GET | /api/employees/:id | Get employee by ID |
| POST | /api/employees/create-account | Create employee with user account |

### Settings & Branding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | Get all settings |
| GET | /api/settings/:key | Get setting by key |
| PUT | /api/settings/:key | Update setting |
| POST | /api/settings/branding/upload | Upload logo/favicon |
| DELETE | /api/settings/branding/logo | Delete company logo |
| DELETE | /api/settings/branding/favicon | Delete favicon |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/email/test | Send test email |
| POST | /api/email/send | Send email (internal use) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get user notifications |
| PUT | /api/notifications/:id/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all as read |
| GET | /api/notifications/targeted | Get targeted notifications |
| POST | /api/notifications/targeted | Send targeted notification |
| DELETE | /api/notifications/targeted/:id | Delete targeted notification |

### Other Resources
All other modules (attendance, leaves, shifts, payroll, documents, announcements, holidays, helpdesk, departments, designations, templates) follow standard REST conventions:
- `GET /api/{resource}` - List all
- `GET /api/{resource}/:id` - Get by ID
- `POST /api/{resource}` - Create
- `PUT /api/{resource}/:id` - Update
- `DELETE /api/{resource}/:id` - Delete

## Database Migration for Existing Systems

If you have an existing database and need to add password reset functionality, run:

```sql
-- Add reset token columns to users table
ALTER TABLE users 
  ADD COLUMN reset_token VARCHAR(255) NULL,
  ADD COLUMN reset_token_expires TIMESTAMP NULL,
  ADD INDEX idx_users_reset_token (reset_token);
```

## Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hrms
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend URL (for CORS and password reset emails)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## Email Configuration

For password reset emails to work, configure SMTP in the admin settings:
1. Go to Admin → Settings → Email Settings
2. Configure SMTP host, port, user, and password
3. Enable email sending
4. Test with the "Send Test Email" button
