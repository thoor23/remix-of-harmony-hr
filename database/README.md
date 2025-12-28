# HRMS Database Setup

This directory contains the MySQL database schema and seed data for the HRMS application.

## Prerequisites

- MySQL 8.0 or higher
- MySQL Workbench (optional, for GUI management)

## Installation

### 1. Install MySQL

**macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

**Windows:**
Download and install from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)

### 2. Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create a dedicated user (recommended for production)
CREATE USER 'hrms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hrms.* TO 'hrms_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 3. Run Schema

```bash
# From the project root directory
mysql -u root -p hrms < database/schema.sql
```

Or if using the dedicated user:
```bash
mysql -u hrms_user -p hrms < database/schema.sql
```

### 4. Run Seed Data (Optional)

```bash
mysql -u root -p hrms < database/seed.sql
```

## Default Users

After running the seed data, you'll have these default users:

| Email | Password | Role |
|-------|----------|------|
| admin@hrms.com | Admin@123 | Admin |
| hr@hrms.com | Admin@123 | HR |
| employee@hrms.com | Admin@123 | Employee |

**Note:** The passwords in seed.sql are placeholder hashes. You should:
1. Either update the password hashes with proper bcrypt hashes
2. Or change the passwords after first login

## Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User authentication |
| `profiles` | User profile information |
| `user_roles` | Role assignments |
| `employees` | Employee details |
| `departments` | Organizational departments |
| `designations` | Job designations |
| `attendance_records` | Daily attendance |
| `leave_types` | Leave type definitions |
| `leave_balances` | Employee leave balances |
| `leave_requests` | Leave applications |
| `shifts` | Shift definitions |
| `shift_assignments` | Employee shift assignments |
| `shift_exchange_requests` | Shift swap requests |
| `salary_structures` | Salary components |
| `payslips` | Payslip records |
| `payslip_templates` | Payslip templates |
| `documents` | Document metadata |
| `holidays` | Company holidays |
| `announcements` | Company announcements |
| `announcement_templates` | Announcement templates |
| `announcement_banner_templates` | Banner templates |
| `letter_templates` | Letter templates |
| `generated_letters` | Generated letters |
| `email_templates` | Email templates |
| `notifications` | User notifications |
| `targeted_notifications` | Bulk notifications |
| `helpdesk_tickets` | Support tickets |
| `system_settings` | App configuration |
| `audit_logs` | Activity tracking |

## Backup & Restore

### Backup
```bash
mysqldump -u root -p hrms > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u root -p hrms < backup_20240101.sql
```

## Troubleshooting

### Connection Issues
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

### Permission Issues
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON hrms.* TO 'hrms_user'@'localhost';
FLUSH PRIVILEGES;
```

### Reset Database
```sql
DROP DATABASE IF EXISTS hrms;
CREATE DATABASE hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Then run the schema and seed files again.
