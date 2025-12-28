const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => { res.json(await query('SELECT * FROM attendance_records ORDER BY date DESC LIMIT 100')); });
router.get('/today', async (req, res) => {
  if (!req.user.employeeId) return res.json(null);
  const records = await query('SELECT * FROM attendance_records WHERE employee_id = ? AND date = CURDATE()', [req.user.employeeId]);
  res.json(records[0] || null);
});
module.exports = router;
