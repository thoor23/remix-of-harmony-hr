const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

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
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

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
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

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

module.exports = router;
