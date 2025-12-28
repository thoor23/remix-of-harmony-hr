const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/attendance - Get all attendance records (admin/HR)
router.get('/', requireAdminOrHR, async (req, res) => {
  try {
    const { month } = req.query;
    let sql = `
      SELECT ar.*, e.employee_id as emp_code, p.first_name, p.last_name
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
    `;
    const params = [];
    
    if (month) {
      sql += ' WHERE DATE_FORMAT(ar.date, "%Y-%m") = ?';
      params.push(month);
    }
    
    sql += ' ORDER BY ar.date DESC LIMIT 500';
    
    const records = await query(sql, params);
    res.json(records);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/today - Get current user's today attendance
router.get('/today', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json(null);
    }
    const records = await query(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = CURDATE()',
      [req.user.employeeId]
    );
    res.json(records[0] || null);
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch today attendance' });
  }
});

// GET /api/attendance/today/stats - Get today's attendance statistics
router.get('/today/stats', requireAdminOrHR, async (req, res) => {
  try {
    const totalEmployees = await query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    const presentToday = await query(
      "SELECT COUNT(DISTINCT employee_id) as count FROM attendance_records WHERE date = CURDATE() AND status IN ('present', 'late')"
    );
    const lateToday = await query(
      "SELECT COUNT(DISTINCT employee_id) as count FROM attendance_records WHERE date = CURDATE() AND status = 'late'"
    );
    const onLeaveToday = await query(
      "SELECT COUNT(*) as count FROM leave_requests WHERE status = 'approved' AND CURDATE() BETWEEN start_date AND end_date"
    );
    
    const total = totalEmployees[0]?.count || 0;
    const present = presentToday[0]?.count || 0;
    const late = lateToday[0]?.count || 0;
    const onLeave = onLeaveToday[0]?.count || 0;
    const absent = Math.max(0, total - present - onLeave);
    
    res.json({
      present,
      absent,
      late,
      onLeave,
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    });
  } catch (error) {
    console.error('Get today stats error:', error);
    res.status(500).json({ error: 'Failed to fetch today stats' });
  }
});

// GET /api/attendance/my - Get current user's attendance
router.get('/my', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json([]);
    }
    
    const { month } = req.query;
    let sql = 'SELECT * FROM attendance_records WHERE employee_id = ?';
    const params = [req.user.employeeId];
    
    if (month) {
      sql += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }
    
    sql += ' ORDER BY date DESC';
    
    const records = await query(sql, params);
    res.json(records);
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/employee/:id - Get specific employee's attendance
router.get('/employee/:id', async (req, res) => {
  try {
    const { month } = req.query;
    let sql = 'SELECT * FROM attendance_records WHERE employee_id = ?';
    const params = [req.params.id];
    
    if (month) {
      sql += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }
    
    sql += ' ORDER BY date DESC';
    
    const records = await query(sql, params);
    res.json(records);
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/attendance/check-in - Clock in
router.post('/check-in', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ error: 'Employee record not found' });
    }
    
    // Check if already clocked in today
    const existing = await query(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = CURDATE()',
      [req.user.employeeId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }
    
    const now = new Date();
    const checkInTime = now.toTimeString().split(' ')[0];
    
    // Determine status (late if after 9:30 AM)
    const hour = now.getHours();
    const minute = now.getMinutes();
    const status = (hour > 9 || (hour === 9 && minute > 30)) ? 'late' : 'present';
    
    const id = uuidv4();
    
    await query(
      'INSERT INTO attendance_records (id, employee_id, date, check_in, status) VALUES (?, ?, CURDATE(), ?, ?)',
      [id, req.user.employeeId, checkInTime, status]
    );
    
    res.status(201).json({ id, check_in: checkInTime, status });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// POST /api/attendance/check-out - Clock out
router.post('/check-out', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ error: 'Employee record not found' });
    }
    
    // Check if clocked in today
    const existing = await query(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = CURDATE()',
      [req.user.employeeId]
    );
    
    if (existing.length === 0) {
      return res.status(400).json({ error: 'Not clocked in today' });
    }
    
    if (existing[0].check_out) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }
    
    const now = new Date();
    const checkOutTime = now.toTimeString().split(' ')[0];
    
    // Calculate work hours
    const checkIn = existing[0].check_in;
    const checkInDate = new Date(`1970-01-01T${checkIn}`);
    const checkOutDate = new Date(`1970-01-01T${checkOutTime}`);
    const workHours = ((checkOutDate - checkInDate) / (1000 * 60 * 60)).toFixed(2);
    
    await query(
      'UPDATE attendance_records SET check_out = ?, work_hours = ? WHERE id = ?',
      [checkOutTime, workHours, existing[0].id]
    );
    
    res.json({ check_out: checkOutTime, work_hours: parseFloat(workHours) });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Failed to check out' });
  }
});

// POST /api/attendance - Create attendance record (admin)
router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out, status, notes } = req.body;
    
    const id = uuidv4();
    
    let workHours = null;
    if (check_in && check_out) {
      const checkInDate = new Date(`1970-01-01T${check_in}`);
      const checkOutDate = new Date(`1970-01-01T${check_out}`);
      workHours = ((checkOutDate - checkInDate) / (1000 * 60 * 60)).toFixed(2);
    }
    
    await query(
      'INSERT INTO attendance_records (id, employee_id, date, check_in, check_out, status, notes, work_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, employee_id, date, check_in || null, check_out || null, status || 'present', notes || null, workHours]
    );
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: 'Failed to create attendance record' });
  }
});

// PUT /api/attendance/:id - Update attendance record (admin)
router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { check_in, check_out, status, notes } = req.body;
    
    let workHours = null;
    if (check_in && check_out) {
      const checkInDate = new Date(`1970-01-01T${check_in}`);
      const checkOutDate = new Date(`1970-01-01T${check_out}`);
      workHours = ((checkOutDate - checkInDate) / (1000 * 60 * 60)).toFixed(2);
    }
    
    await query(
      'UPDATE attendance_records SET check_in = ?, check_out = ?, status = ?, notes = ?, work_hours = ? WHERE id = ?',
      [check_in || null, check_out || null, status, notes || null, workHours, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

module.exports = router;
