const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/designations - Get all designations
router.get('/', async (req, res) => {
  try {
    const designations = await query(`
      SELECT des.*, d.name as department_name
      FROM designations des
      LEFT JOIN departments d ON des.department_id = d.id
      ORDER BY des.name
    `);
    res.json(designations);
  } catch (error) {
    console.error('Get designations error:', error);
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
});

// GET /api/designations/:id - Get specific designation
router.get('/:id', async (req, res) => {
  try {
    const designations = await query('SELECT * FROM designations WHERE id = ?', [req.params.id]);
    if (designations.length === 0) {
      return res.status(404).json({ error: 'Designation not found' });
    }
    res.json(designations[0]);
  } catch (error) {
    console.error('Get designation error:', error);
    res.status(500).json({ error: 'Failed to fetch designation' });
  }
});

// POST /api/designations - Create designation
router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, level, department_id } = req.body;
    
    // Check if code already exists
    const existing = await query('SELECT id FROM designations WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Designation code already exists' });
    }
    
    const id = uuidv4();
    
    await query(
      'INSERT INTO designations (id, name, code, level, department_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, code, level || 1, department_id || null]
    );
    
    res.status(201).json({ id, name, code, level, department_id });
  } catch (error) {
    console.error('Create designation error:', error);
    res.status(500).json({ error: 'Failed to create designation' });
  }
});

// PATCH /api/designations/:id - Update designation
router.patch('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, level, department_id } = req.body;
    
    // Check if code already exists for another designation
    if (code) {
      const existing = await query('SELECT id FROM designations WHERE code = ? AND id != ?', [code, req.params.id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Designation code already exists' });
      }
    }
    
    await query(
      `UPDATE designations SET 
       name = COALESCE(?, name),
       code = COALESCE(?, code),
       level = COALESCE(?, level),
       department_id = ?,
       updated_at = NOW()
       WHERE id = ?`,
      [name, code, level, department_id || null, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update designation error:', error);
    res.status(500).json({ error: 'Failed to update designation' });
  }
});

// DELETE /api/designations/:id - Delete designation
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    // Check if designation has employees
    const employees = await query('SELECT id FROM employees WHERE designation_id = ? LIMIT 1', [req.params.id]);
    if (employees.length > 0) {
      return res.status(400).json({ error: 'Cannot delete designation with assigned employees' });
    }
    
    await query('DELETE FROM designations WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete designation error:', error);
    res.status(500).json({ error: 'Failed to delete designation' });
  }
});

module.exports = router;
