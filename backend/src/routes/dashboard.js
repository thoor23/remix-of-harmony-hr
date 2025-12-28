const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const [employees] = await query('SELECT COUNT(*) as count FROM employees WHERE status = "active"');
    const [pendingLeaves] = await query('SELECT COUNT(*) as count FROM leave_requests WHERE status = "pending"');
    const [presentToday] = await query('SELECT COUNT(*) as count FROM attendance_records WHERE date = CURDATE() AND status = "present"');
    res.json({
      totalEmployees: employees?.count || 0,
      pendingLeaveRequests: pendingLeaves?.count || 0,
      presentToday: presentToday?.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
