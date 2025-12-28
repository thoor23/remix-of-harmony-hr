const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/departments - Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await query(`
      SELECT d.*, 
             (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.status = 'active') as employee_count
      FROM departments d 
      ORDER BY d.name
    `);
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET /api/departments/:id - Get specific department
router.get('/:id', async (req, res) => {
  try {
    const departments = await query('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    if (departments.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(departments[0]);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// POST /api/departments - Create department
router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, description, head_id } = req.body;
    
    // Check if code already exists
    const existing = await query('SELECT id FROM departments WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Department code already exists' });
    }
    
    const id = uuidv4();
    
    await query(
      'INSERT INTO departments (id, name, code, description, head_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, code, description || null, head_id || null]
    );
    
    res.status(201).json({ id, name, code, description, head_id });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/departments/:id - Update department
router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, description, head_id } = req.body;
    
    // Check if code already exists for another department
    if (code) {
      const existing = await query('SELECT id FROM departments WHERE code = ? AND id != ?', [code, req.params.id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Department code already exists' });
      }
    }
    
    await query(
      `UPDATE departments SET 
       name = COALESCE(?, name),
       code = COALESCE(?, code),
       description = ?,
       head_id = ?,
       updated_at = NOW()
       WHERE id = ?`,
      [name, code, description || null, head_id || null, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id - Delete department
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    // Check if department has employees
    const employees = await query('SELECT id FROM employees WHERE department_id = ? LIMIT 1', [req.params.id]);
    if (employees.length > 0) {
      return res.status(400).json({ error: 'Cannot delete department with assigned employees' });
    }
    
    await query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;
