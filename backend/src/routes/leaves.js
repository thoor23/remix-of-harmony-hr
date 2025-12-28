const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/types', async (req, res) => { res.json(await query('SELECT * FROM leave_types')); });
router.get('/requests', async (req, res) => { res.json(await query('SELECT * FROM leave_requests ORDER BY created_at DESC')); });
router.get('/balances', async (req, res) => {
  if (!req.user.employeeId) return res.json([]);
  res.json(await query('SELECT lb.*, lt.name, lt.code FROM leave_balances lb JOIN leave_types lt ON lb.leave_type_id = lt.id WHERE lb.employee_id = ?', [req.user.employeeId]));
});
module.exports = router;
