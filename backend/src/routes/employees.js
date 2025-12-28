const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/employees - Get all employees (admin/HR only)
router.get('/', requireAdminOrHR, async (req, res) => {
  try {
    const employees = await query(`
      SELECT e.*, p.first_name, p.last_name, p.email, p.phone, p.avatar_url,
             d.name as department_name, des.name as designation_name
      FROM employees e
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      ORDER BY e.created_at DESC
    `);
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employees/current - Get current user's employee record
router.get('/current', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(404).json({ error: 'Employee record not found' });
    }
    const employees = await query(`
      SELECT e.*, p.first_name, p.last_name, p.email, p.phone, p.avatar_url,
             d.name as department_name, des.name as designation_name
      FROM employees e
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE e.id = ?
    `, [req.user.employeeId]);
    res.json(employees[0] || null);
  } catch (error) {
    console.error('Get current employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// GET /api/employees/role/:userId - Get user's role
router.get('/role/:userId', async (req, res) => {
  try {
    const roles = await query(
      'SELECT role FROM user_roles WHERE user_id = ? LIMIT 1',
      [req.params.userId]
    );
    res.json(roles[0] || { role: 'employee' });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// GET /api/employees/:id - Get specific employee
router.get('/:id', async (req, res) => {
  try {
    const employees = await query(`
      SELECT e.*, p.first_name, p.last_name, p.email, p.phone, p.avatar_url,
             d.name as department_name, des.name as designation_name
      FROM employees e
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE e.id = ?
    `, [req.params.id]);
    if (employees.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(employees[0]);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employees/create-account - Create employee with user account
router.post('/create-account', requireAdminOrHR, async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role, employee_data } = req.body;
    
    // Check if email exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const userId = uuidv4();
    const employeeId = uuidv4();
    const passwordHash = await hashPassword(password);
    
    // Create user
    await query(
      'INSERT INTO users (id, email, password_hash, email_confirmed_at) VALUES (?, ?, ?, NOW())',
      [userId, email, passwordHash]
    );
    
    // Create profile
    await query(
      'INSERT INTO profiles (id, user_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), userId, first_name, last_name, email, phone || null]
    );
    
    // Create role
    await query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), userId, role || 'employee']
    );
    
    // Create employee record
    const ed = employee_data || {};
    await query(
      `INSERT INTO employees (id, user_id, employee_id, date_of_birth, date_of_joining, department_id, 
       designation_id, employment_type, reporting_to, address_street, address_city, address_state,
       address_zip_code, address_country, emergency_contact_name, emergency_contact_relationship,
       emergency_contact_phone, bank_name, bank_account_holder_name, bank_account_number, bank_ifsc_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, userId, ed.employee_id, ed.date_of_birth || null, ed.date_of_joining,
       ed.department_id || null, ed.designation_id || null, ed.employment_type || 'full-time',
       ed.reporting_to || null, ed.address_street || null, ed.address_city || null,
       ed.address_state || null, ed.address_zip_code || null, ed.address_country || null,
       ed.emergency_contact_name || null, ed.emergency_contact_relationship || null,
       ed.emergency_contact_phone || null, ed.bank_name || null, ed.bank_account_holder_name || null,
       ed.bank_account_number || null, ed.bank_ifsc_code || null]
    );
    
    res.status(201).json({ userId, employeeId });
  } catch (error) {
    console.error('Create employee account error:', error);
    res.status(500).json({ error: 'Failed to create employee account' });
  }
});

// POST /api/employees - Create employee without user account
router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const ed = req.body;
    const employeeId = uuidv4();
    
    await query(
      `INSERT INTO employees (id, employee_id, date_of_birth, date_of_joining, department_id, 
       designation_id, employment_type, reporting_to, address_street, address_city, address_state,
       address_zip_code, address_country, emergency_contact_name, emergency_contact_relationship,
       emergency_contact_phone, bank_name, bank_account_holder_name, bank_account_number, bank_ifsc_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, ed.employee_id, ed.date_of_birth || null, ed.date_of_joining || new Date().toISOString().split('T')[0],
       ed.department_id || null, ed.designation_id || null, ed.employment_type || 'full-time',
       ed.reporting_to || null, ed.address_street || null, ed.address_city || null,
       ed.address_state || null, ed.address_zip_code || null, ed.address_country || null,
       ed.emergency_contact_name || null, ed.emergency_contact_relationship || null,
       ed.emergency_contact_phone || null, ed.bank_name || null, ed.bank_account_holder_name || null,
       ed.bank_account_number || null, ed.bank_ifsc_code || null, ed.status || 'active']
    );
    
    res.status(201).json({ id: employeeId });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const ed = req.body;
    
    await query(
      `UPDATE employees SET 
       employee_id = COALESCE(?, employee_id),
       date_of_birth = COALESCE(?, date_of_birth),
       date_of_joining = COALESCE(?, date_of_joining),
       department_id = ?,
       designation_id = ?,
       employment_type = COALESCE(?, employment_type),
       reporting_to = ?,
       address_street = ?,
       address_city = ?,
       address_state = ?,
       address_zip_code = ?,
       address_country = ?,
       emergency_contact_name = ?,
       emergency_contact_relationship = ?,
       emergency_contact_phone = ?,
       bank_name = ?,
       bank_account_holder_name = ?,
       bank_account_number = ?,
       bank_ifsc_code = ?,
       status = COALESCE(?, status),
       updated_at = NOW()
       WHERE id = ?`,
      [ed.employee_id, ed.date_of_birth, ed.date_of_joining,
       ed.department_id || null, ed.designation_id || null, ed.employment_type,
       ed.reporting_to || null, ed.address_street || null, ed.address_city || null,
       ed.address_state || null, ed.address_zip_code || null, ed.address_country || null,
       ed.emergency_contact_name || null, ed.emergency_contact_relationship || null,
       ed.emergency_contact_phone || null, ed.bank_name || null, ed.bank_account_holder_name || null,
       ed.bank_account_number || null, ed.bank_ifsc_code || null, ed.status, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// PUT /api/employees/:id/account - Update employee account (role, status, password)
router.put('/:id/account', requireAdminOrHR, async (req, res) => {
  try {
    const { role, status, password, email } = req.body;
    
    // Get employee to find user_id
    const employees = await query('SELECT user_id FROM employees WHERE id = ?', [req.params.id]);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const userId = employees[0].user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'Employee has no user account' });
    }
    
    // Update role if provided
    if (role) {
      await query('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, userId]);
    }
    
    // Update status if provided
    if (status) {
      await query('UPDATE employees SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    }
    
    // Update password if provided
    if (password) {
      const passwordHash = await hashPassword(password);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    }
    
    // Update email if provided
    if (email) {
      await query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
      await query('UPDATE profiles SET email = ? WHERE user_id = ?', [email, userId]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update employee account error:', error);
    res.status(500).json({ error: 'Failed to update employee account' });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    // Get employee to find user_id
    const employees = await query('SELECT user_id FROM employees WHERE id = ?', [req.params.id]);
    
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const userId = employees[0].user_id;
    
    // Delete employee record first (foreign key constraints)
    await query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    
    // If user account exists, delete related records
    if (userId) {
      await query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
      await query('DELETE FROM profiles WHERE user_id = ?', [userId]);
      await query('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await query('DELETE FROM users WHERE id = ?', [userId]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// GET /api/employees/:id/attendance - Get employee attendance
router.get('/:id/attendance', async (req, res) => {
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

// GET /api/employees/:id/leaves - Get employee leave requests
router.get('/:id/leaves', async (req, res) => {
  try {
    const leaves = await query(`
      SELECT lr.*, lt.name as leave_type_name, lt.code as leave_type_code
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.employee_id = ?
      ORDER BY lr.created_at DESC
    `, [req.params.id]);
    res.json(leaves);
  } catch (error) {
    console.error('Get employee leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

module.exports = router;
