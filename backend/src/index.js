const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const designationRoutes = require('./routes/designations');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const shiftRoutes = require('./routes/shifts');
const payrollRoutes = require('./routes/payroll');
const documentRoutes = require('./routes/documents');
const announcementRoutes = require('./routes/announcements');
const templateRoutes = require('./routes/templates');
const notificationRoutes = require('./routes/notifications');
const helpdeskRoutes = require('./routes/helpdesk');
const holidayRoutes = require('./routes/holidays');
const settingsRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');
const dashboardRoutes = require('./routes/dashboard');
const emailRoutes = require('./routes/email');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', message: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 HRMS Backend Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
