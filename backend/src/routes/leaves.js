const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// ==================== LEAVE TYPES ====================

// GET /api/leaves/types - Get all leave types
router.get('/types', async (req, res) => {
  try {
    const types = await query('SELECT * FROM leave_types ORDER BY name');
    res.json(types);
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ error: 'Failed to fetch leave types' });
  }
});

// POST /api/leaves/types - Create leave type
router.post('/types', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, max_days, color, carry_forward, encashable } = req.body;
    
    // Check if code exists
    const existing = await query('SELECT id FROM leave_types WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Leave type code already exists' });
    }
    
    const id = uuidv4();
    
    await query(
      'INSERT INTO leave_types (id, name, code, max_days, color, carry_forward, encashable) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, code, max_days || 12, color || '#3B82F6', carry_forward || false, encashable || false]
    );
    
    res.status(201).json({ id, name, code, max_days, color, carry_forward, encashable });
  } catch (error) {
    console.error('Create leave type error:', error);
    res.status(500).json({ error: 'Failed to create leave type' });
  }
});

// PUT /api/leaves/types/:id - Update leave type
router.put('/types/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, max_days, color, carry_forward, encashable } = req.body;
    
    // Check if code exists for another type
    if (code) {
      const existing = await query('SELECT id FROM leave_types WHERE code = ? AND id != ?', [code, req.params.id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Leave type code already exists' });
      }
    }
    
    await query(
      `UPDATE leave_types SET 
       name = COALESCE(?, name),
       code = COALESCE(?, code),
       max_days = COALESCE(?, max_days),
       color = COALESCE(?, color),
       carry_forward = COALESCE(?, carry_forward),
       encashable = COALESCE(?, encashable)
       WHERE id = ?`,
      [name, code, max_days, color, carry_forward, encashable, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update leave type error:', error);
    res.status(500).json({ error: 'Failed to update leave type' });
  }
});

// DELETE /api/leaves/types/:id - Delete leave type
router.delete('/types/:id', requireAdminOrHR, async (req, res) => {
  try {
    // Check if leave type is in use
    const requests = await query('SELECT id FROM leave_requests WHERE leave_type_id = ? LIMIT 1', [req.params.id]);
    if (requests.length > 0) {
      return res.status(400).json({ error: 'Cannot delete leave type with existing requests' });
    }
    
    await query('DELETE FROM leave_balances WHERE leave_type_id = ?', [req.params.id]);
    await query('DELETE FROM leave_types WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete leave type error:', error);
    res.status(500).json({ error: 'Failed to delete leave type' });
  }
});

// ==================== LEAVE REQUESTS ====================

// GET /api/leaves/requests - Get all leave requests (admin/HR)
router.get('/requests', requireAdminOrHR, async (req, res) => {
  try {
    const { status, employee_id, limit } = req.query;
    
    let sql = `
      SELECT lr.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color,
             e.employee_id as emp_code, p.first_name, p.last_name
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push('lr.status = ?');
      params.push(status);
    }
    
    if (employee_id) {
      conditions.push('lr.employee_id = ?');
      params.push(employee_id);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY lr.created_at DESC';
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const requests = await query(sql, params);
    res.json(requests);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// GET /api/leaves/requests/pending - Get pending leave requests with limit
router.get('/requests/pending', requireAdminOrHR, async (req, res) => {
  try {
    const { limit } = req.query;
    
    let sql = `
      SELECT lr.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color,
             e.employee_id as emp_code, p.first_name, p.last_name
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE lr.status = 'pending'
      ORDER BY lr.created_at DESC
    `;
    
    const params = [];
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const requests = await query(sql, params);
    res.json(requests);
  } catch (error) {
    console.error('Get pending leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending leave requests' });
  }
});

// GET /api/leaves/requests/my - Get current user's leave requests
router.get('/requests/my', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json([]);
    }
    
    const requests = await query(`
      SELECT lr.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.employee_id = ?
      ORDER BY lr.created_at DESC
    `, [req.user.employeeId]);
    
    res.json(requests);
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// GET /api/leaves/requests/employee/:id - Get employee's leave requests
router.get('/requests/employee/:id', async (req, res) => {
  try {
    const requests = await query(`
      SELECT lr.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.employee_id = ?
      ORDER BY lr.created_at DESC
    `, [req.params.id]);
    
    res.json(requests);
  } catch (error) {
    console.error('Get employee leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// POST /api/leaves/requests - Create leave request
router.post('/requests', async (req, res) => {
  try {
    const employeeId = req.body.employee_id || req.user.employeeId;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID required' });
    }
    
    const { leave_type_id, start_date, end_date, days, reason } = req.body;
    
    const id = uuidv4();
    
    await query(
      `INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, employeeId, leave_type_id, start_date, end_date, days, reason || null]
    );
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// PATCH /api/leaves/requests/:id - Update leave request status
router.patch('/requests/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    const updateFields = [];
    const params = [];
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
      
      if (status === 'approved' || status === 'rejected') {
        updateFields.push('approved_by = ?');
        updateFields.push('approved_on = NOW()');
        params.push(req.user.employeeId || req.user.id);
      }
    }
    
    if (comments !== undefined) {
      updateFields.push('comments = ?');
      params.push(comments);
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(req.params.id);
    
    await query(`UPDATE leave_requests SET ${updateFields.join(', ')} WHERE id = ?`, params);
    
    // If approved, update leave balance
    if (status === 'approved') {
      const request = await query('SELECT employee_id, leave_type_id, days FROM leave_requests WHERE id = ?', [req.params.id]);
      if (request.length > 0) {
        const { employee_id, leave_type_id, days } = request[0];
        const year = new Date().getFullYear();
        
        // Check if balance record exists
        const balance = await query(
          'SELECT id, used_days FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
          [employee_id, leave_type_id, year]
        );
        
        if (balance.length > 0) {
          await query(
            'UPDATE leave_balances SET used_days = used_days + ?, updated_at = NOW() WHERE id = ?',
            [days, balance[0].id]
          );
        } else {
          // Get max days from leave type
          const leaveType = await query('SELECT max_days FROM leave_types WHERE id = ?', [leave_type_id]);
          const totalDays = leaveType[0]?.max_days || 12;
          
          await query(
            'INSERT INTO leave_balances (id, employee_id, leave_type_id, year, total_days, used_days) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), employee_id, leave_type_id, year, totalDays, days]
          );
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

// DELETE /api/leaves/requests/:id - Cancel/delete leave request
router.delete('/requests/:id', async (req, res) => {
  try {
    // Get the request
    const requests = await query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const request = requests[0];
    
    // Check if user owns this request or is admin/HR
    const isOwner = req.user.employeeId === request.employee_id;
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwner && !isAdminOrHR) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Only allow canceling pending requests (unless admin/HR)
    if (request.status !== 'pending' && !isAdminOrHR) {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }
    
    await query('DELETE FROM leave_requests WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

// ==================== LEAVE BALANCES ====================

// GET /api/leaves/balances - Get current user's leave balances
router.get('/balances', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json([]);
    }
    
    const year = req.query.year || new Date().getFullYear();
    
    const balances = await query(`
      SELECT lb.*, lt.name, lt.code, lt.color, lt.max_days
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = ? AND lb.year = ?
    `, [req.user.employeeId, year]);
    
    res.json(balances);
  } catch (error) {
    console.error('Get leave balances error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balances' });
  }
});

// GET /api/leaves/balances/:employeeId - Get employee's leave balances
router.get('/balances/:employeeId', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    const balances = await query(`
      SELECT lb.*, lt.name, lt.code, lt.color, lt.max_days
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = ? AND lb.year = ?
    `, [req.params.employeeId, year]);
    
    res.json(balances);
  } catch (error) {
    console.error('Get employee leave balances error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balances' });
  }
});

// POST /api/leaves/balances - Create/initialize leave balances for employee
router.post('/balances', requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, year } = req.body;
    const targetYear = year || new Date().getFullYear();
    
    // Get all leave types
    const leaveTypes = await query('SELECT id, max_days FROM leave_types');
    
    // Create balances for each type
    for (const lt of leaveTypes) {
      const existing = await query(
        'SELECT id FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
        [employee_id, lt.id, targetYear]
      );
      
      if (existing.length === 0) {
        await query(
          'INSERT INTO leave_balances (id, employee_id, leave_type_id, year, total_days, used_days) VALUES (?, ?, ?, ?, ?, 0)',
          [uuidv4(), employee_id, lt.id, targetYear, lt.max_days]
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Create leave balances error:', error);
    res.status(500).json({ error: 'Failed to create leave balances' });
  }
});

// PUT /api/leaves/balances/:id - Update leave balance
router.put('/balances/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { total_days, used_days } = req.body;
    
    await query(
      'UPDATE leave_balances SET total_days = ?, used_days = ?, updated_at = NOW() WHERE id = ?',
      [total_days, used_days, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update leave balance error:', error);
    res.status(500).json({ error: 'Failed to update leave balance' });
  }
});

module.exports = router;
