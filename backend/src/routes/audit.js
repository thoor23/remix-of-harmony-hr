const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/audit - Get audit logs with optional filters (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { action, module, performed_by, start_date, end_date, limit = 100 } = req.query;
    
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }
    if (module) {
      sql += ' AND module = ?';
      params.push(module);
    }
    if (performed_by) {
      sql += ' AND performed_by = ?';
      params.push(performed_by);
    }
    if (start_date) {
      sql += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND created_at <= ?';
      params.push(end_date);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const logs = await query(sql, params);
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// POST /api/audit - Create an audit log entry
router.post('/', async (req, res) => {
  try {
    const { action, module, description, metadata } = req.body;
    const id = uuidv4();
    
    // Get performer name from profile
    let performer_name = null;
    if (req.user.userId) {
      const profiles = await query('SELECT first_name, last_name FROM profiles WHERE user_id = ?', [req.user.userId]);
      if (profiles.length > 0) {
        performer_name = `${profiles[0].first_name || ''} ${profiles[0].last_name || ''}`.trim() || null;
      }
    }
    
    await query(
      'INSERT INTO audit_logs (id, action, module, description, performed_by, performer_name, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, action, module, description, req.user.userId, performer_name, JSON.stringify(metadata || {}), req.ip]
    );
    
    res.status(201).json({ id, action, module, description, performed_by: req.user.userId, performer_name, metadata });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// GET /api/audit/actions - Get unique actions for filtering
router.get('/actions', requireAdmin, async (req, res) => {
  try {
    const actions = await query('SELECT DISTINCT action FROM audit_logs ORDER BY action');
    res.json(actions.map(a => a.action));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// GET /api/audit/modules - Get unique modules for filtering
router.get('/modules', requireAdmin, async (req, res) => {
  try {
    const modules = await query('SELECT DISTINCT module FROM audit_logs ORDER BY module');
    res.json(modules.map(m => m.module));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

module.exports = router;
