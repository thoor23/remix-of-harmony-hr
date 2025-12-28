// Placeholder routes - implement as needed
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
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

module.exports = router;
