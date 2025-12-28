const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/notifications - Get user notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// GET /api/notifications/targeted - Get targeted notifications (admin)
router.get('/targeted', requireAdminOrHR, async (req, res) => {
  try {
    const notifications = await query(
      'SELECT * FROM targeted_notifications ORDER BY sent_at DESC'
    );
    
    // Parse target_ids JSON
    const parsed = notifications.map(n => ({
      ...n,
      target_ids: n.target_ids ? (typeof n.target_ids === 'string' ? JSON.parse(n.target_ids) : n.target_ids) : []
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error('Get targeted notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch targeted notifications' });
  }
});

// POST /api/notifications/targeted - Send targeted notification
router.post('/targeted', requireAdminOrHR, async (req, res) => {
  try {
    const { title, message, type, priority, target_type, target_ids } = req.body;
    
    const id = uuidv4();
    
    // Insert targeted notification record
    await query(
      `INSERT INTO targeted_notifications (id, title, message, type, priority, target_type, target_ids, sent_by, sent_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, title, message, type || 'info', priority || 'normal', target_type, JSON.stringify(target_ids || []), req.user.id]
    );
    
    // Get user IDs based on target type
    let userIds = [];
    
    if (target_type === 'all') {
      const employees = await query(
        "SELECT user_id FROM employees WHERE status = 'active' AND user_id IS NOT NULL"
      );
      userIds = employees.map(e => e.user_id);
    } else if (target_type === 'department' && target_ids?.length > 0) {
      const placeholders = target_ids.map(() => '?').join(',');
      const employees = await query(
        `SELECT user_id FROM employees WHERE department_id IN (${placeholders}) AND status = 'active' AND user_id IS NOT NULL`,
        target_ids
      );
      userIds = employees.map(e => e.user_id);
    } else if (target_type === 'employees' && target_ids?.length > 0) {
      const placeholders = target_ids.map(() => '?').join(',');
      const employees = await query(
        `SELECT user_id FROM employees WHERE id IN (${placeholders}) AND user_id IS NOT NULL`,
        target_ids
      );
      userIds = employees.map(e => e.user_id);
    }
    
    // Create notifications for all target users
    if (userIds.length > 0) {
      const values = userIds.map(userId => 
        `('${uuidv4()}', '${userId}', '${title.replace(/'/g, "''")}', '${message.replace(/'/g, "''")}', '${type || 'info'}')`
      ).join(',');
      
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type) VALUES ${values}`
      );
    }
    
    res.json({ 
      targetedNotification: { id, title, message, type, priority, target_type, target_ids, sent_by: req.user.id },
      recipientCount: userIds.length 
    });
  } catch (error) {
    console.error('Send targeted notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// DELETE /api/notifications/targeted/:id - Delete targeted notification record
router.delete('/targeted/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM targeted_notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete targeted notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
