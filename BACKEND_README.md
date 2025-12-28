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

## Production Deployment

### Important: Backend Must Be Accessible

The backend **must be publicly accessible** from wherever the frontend is hosted. Here are deployment options:

### Option 1: Railway (Recommended)
1. Push your code to GitHub
2. Create account at [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Add MySQL database service
5. Set environment variables in Railway dashboard
6. Railway provides a public URL automatically

### Option 2: Render
1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add MySQL database (use external provider like PlanetScale)

### Option 3: Docker
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t hrms-backend ./backend
docker run -p 3001:3001 --env-file ./backend/.env hrms-backend
```

### Option 4: VPS (DigitalOcean, Linode, AWS EC2)
1. SSH into your server
2. Install Node.js 18+ and MySQL
3. Clone repository
4. Setup PM2 for process management:
```bash
npm install -g pm2
cd backend
npm install
pm2 start src/index.js --name hrms-backend
pm2 save
pm2 startup
```

### Environment Variables for Production
```env
PORT=3001
NODE_ENV=production

# MySQL (use your cloud database URL)
DB_HOST=your-db-host.com
DB_PORT=3306
DB_NAME=hrms
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# JWT (use long, random strings)
JWT_ACCESS_SECRET=generate-a-64-char-random-string
JWT_REFRESH_SECRET=generate-another-64-char-random-string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend URL (your production frontend URL)
FRONTEND_URL=https://your-app.lovable.app

# Optional: Additional CORS origins (comma-separated)
ALLOWED_ORIGINS=https://your-custom-domain.com,https://another-domain.com
```

### Frontend Environment for Production
Set your production API URL:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

## Troubleshooting

### "Failed to fetch" errors
1. Check if backend is running: `curl http://localhost:3001/health`
2. Verify CORS is configured for your frontend URL
3. Check browser console for specific error messages

### Login not working
1. Ensure database is seeded: `mysql -u root -p hrms < database/seed.sql`
2. Verify password hash is valid bcrypt format
3. Check backend logs for authentication errors

### CORS errors
1. Add your frontend URL to `FRONTEND_URL` env variable
2. Or add to `ALLOWED_ORIGINS` for multiple domains
