const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/helpdesk - Get all tickets (admin/HR)
router.get('/', requireAdminOrHR, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    
    let sql = `
      SELECT ht.*, e.employee_id as emp_code, p.first_name, p.last_name,
             ap.first_name as assigned_first_name, ap.last_name as assigned_last_name
      FROM helpdesk_tickets ht
      LEFT JOIN employees e ON ht.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN employees ae ON ht.assigned_to = ae.id
      LEFT JOIN profiles ap ON ae.user_id = ap.user_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push('ht.status = ?');
      params.push(status);
    }
    
    if (category) {
      conditions.push('ht.category = ?');
      params.push(category);
    }
    
    if (priority) {
      conditions.push('ht.priority = ?');
      params.push(priority);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY ht.created_at DESC';
    
    const tickets = await query(sql, params);
    res.json(tickets);
  } catch (error) {
    console.error('Get helpdesk tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/helpdesk/my - Get current user's tickets
router.get('/my', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json([]);
    }
    
    const tickets = await query(`
      SELECT ht.*, 
             ap.first_name as assigned_first_name, ap.last_name as assigned_last_name
      FROM helpdesk_tickets ht
      LEFT JOIN employees ae ON ht.assigned_to = ae.id
      LEFT JOIN profiles ap ON ae.user_id = ap.user_id
      WHERE ht.employee_id = ?
      ORDER BY ht.created_at DESC
    `, [req.user.employeeId]);
    
    res.json(tickets);
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/helpdesk/employee/:id - Get employee's tickets
router.get('/employee/:id', async (req, res) => {
  try {
    const tickets = await query(`
      SELECT ht.*, 
             ap.first_name as assigned_first_name, ap.last_name as assigned_last_name
      FROM helpdesk_tickets ht
      LEFT JOIN employees ae ON ht.assigned_to = ae.id
      LEFT JOIN profiles ap ON ae.user_id = ap.user_id
      WHERE ht.employee_id = ?
      ORDER BY ht.created_at DESC
    `, [req.params.id]);
    
    res.json(tickets);
  } catch (error) {
    console.error('Get employee tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/helpdesk/stats - Get ticket statistics
router.get('/stats', requireAdminOrHR, async (req, res) => {
  try {
    const total = await query('SELECT COUNT(*) as count FROM helpdesk_tickets');
    const open = await query("SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'open'");
    const inProgress = await query("SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'in_progress'");
    const resolved = await query("SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'resolved'");
    const closed = await query("SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'closed'");
    
    res.json({
      total: total[0]?.count || 0,
      open: open[0]?.count || 0,
      inProgress: inProgress[0]?.count || 0,
      resolved: resolved[0]?.count || 0,
      closed: closed[0]?.count || 0
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket stats' });
  }
});

// GET /api/helpdesk/:id - Get specific ticket
router.get('/:id', async (req, res) => {
  try {
    const tickets = await query(`
      SELECT ht.*, e.employee_id as emp_code, p.first_name, p.last_name,
             ap.first_name as assigned_first_name, ap.last_name as assigned_last_name
      FROM helpdesk_tickets ht
      LEFT JOIN employees e ON ht.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN employees ae ON ht.assigned_to = ae.id
      LEFT JOIN profiles ap ON ae.user_id = ap.user_id
      WHERE ht.id = ?
    `, [req.params.id]);
    
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(tickets[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/helpdesk - Create ticket
router.post('/', async (req, res) => {
  try {
    const employeeId = req.body.employee_id || req.user.employeeId;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID required' });
    }
    
    const { subject, description, category, priority } = req.body;
    
    const id = uuidv4();
    
    await query(
      `INSERT INTO helpdesk_tickets (id, employee_id, subject, description, category, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      [id, employeeId, subject, description || null, category || 'general', priority || 'medium']
    );
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PATCH /api/helpdesk/:id - Update ticket
router.patch('/:id', async (req, res) => {
  try {
    const { status, assigned_to, priority, category, description } = req.body;
    
    const updateFields = [];
    const params = [];
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
      
      if (status === 'resolved' || status === 'closed') {
        updateFields.push('resolved_at = NOW()');
      }
    }
    
    if (assigned_to !== undefined) {
      updateFields.push('assigned_to = ?');
      params.push(assigned_to || null);
    }
    
    if (priority) {
      updateFields.push('priority = ?');
      params.push(priority);
    }
    
    if (category) {
      updateFields.push('category = ?');
      params.push(category);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(req.params.id);
    
    await query(`UPDATE helpdesk_tickets SET ${updateFields.join(', ')} WHERE id = ?`, params);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE /api/helpdesk/:id - Delete ticket (admin only)
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM helpdesk_tickets WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;
