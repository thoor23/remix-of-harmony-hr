# HRMS Project - Complete Setup Guide

This project has been restructured to use a **separate Node.js Express backend** with **MySQL database**.

## Project Structure

```
hrms-project/
├── frontend/          # React frontend (current Lovable code)
├── backend/           # Node.js Express API
│   ├── src/
│   │   ├── config/    # Database configuration
│   │   ├── middleware/# Auth & role middleware
│   │   ├── routes/    # API route handlers
│   │   └── utils/     # JWT & password utilities
│   ├── package.json
│   └── .env.example
├── database/          # MySQL setup files
│   ├── schema.sql     # Complete database schema
│   ├── seed.sql       # Sample data
│   └── README.md
└── README.md          # This file
```

## Quick Start

### 1. Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hrms;
USE hrms;

# Run schema
SOURCE database/schema.sql;

# (Optional) Run seed data
SOURCE database/seed.sql;
```

### 2. Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=hrms

# Install dependencies
npm install

# Start server
npm run dev
# Server runs on http://localhost:3001
```

### 3. Setup Frontend

```bash
cd frontend

# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend runs on http://localhost:5173
```

## Default Login Credentials

After running seed.sql:

| Email | Password | Role |
|-------|----------|------|
| admin@hrms.com | Admin@123 | Admin |
| hr@hrms.com | Admin@123 | HR |
| employee@hrms.com | Admin@123 | Employee |

## API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET /api/employees` - List employees
- `GET /api/departments` - List departments
- `GET /api/leaves/requests` - Leave requests
- `GET /api/attendance` - Attendance records
- ... and many more

## Frontend Updates Required

The frontend code still uses Supabase. You need to:

1. Create `src/lib/api.ts` with fetch calls to the backend
2. Update `AuthContext.tsx` to use JWT authentication
3. Update all hooks in `src/hooks/` to use the new API

## Technologies

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8.0+
- **Auth:** JWT (JSON Web Tokens)
