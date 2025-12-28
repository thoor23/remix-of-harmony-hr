const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// ==================== SHIFTS ====================
router.get('/', async (req, res) => {
  try {
    const shifts = await query('SELECT * FROM shifts ORDER BY start_time');
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shifts = await query('SELECT * FROM shifts WHERE id = ?', [req.params.id]);
    if (shifts.length === 0) return res.status(404).json({ error: 'Shift not found' });
    res.json(shifts[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
});

router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, start_time, end_time, break_duration, color, is_active } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO shifts (id, name, code, start_time, end_time, break_duration, color, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, code, start_time, end_time, break_duration || 0, color || '#3B82F6', is_active !== false]
    );
    const shifts = await query('SELECT * FROM shifts WHERE id = ?', [id]);
    res.status(201).json(shifts[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, code, start_time, end_time, break_duration, color, is_active } = req.body;
    await query(
      'UPDATE shifts SET name = ?, code = ?, start_time = ?, end_time = ?, break_duration = ?, color = ?, is_active = ? WHERE id = ?',
      [name, code, start_time, end_time, break_duration, color, is_active, req.params.id]
    );
    const shifts = await query('SELECT * FROM shifts WHERE id = ?', [req.params.id]);
    res.json(shifts[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM shifts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

// ==================== SHIFT ASSIGNMENTS ====================
router.get('/assignments/list', async (req, res) => {
  try {
    const assignments = await query(`
      SELECT sa.*, s.name as shift_name, s.code as shift_code, s.color as shift_color,
             e.employee_id as emp_code, p.first_name, p.last_name
      FROM shift_assignments sa
      LEFT JOIN shifts s ON sa.shift_id = s.id
      LEFT JOIN employees e ON sa.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      ORDER BY sa.start_date DESC
    `);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shift assignments' });
  }
});

router.post('/assignments', requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, shift_id, start_date, end_date, is_active } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO shift_assignments (id, employee_id, shift_id, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [id, employee_id, shift_id, start_date, end_date || null, is_active !== false]
    );
    const assignments = await query('SELECT * FROM shift_assignments WHERE id = ?', [id]);
    res.status(201).json(assignments[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shift assignment' });
  }
});

router.put('/assignments/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, shift_id, start_date, end_date, is_active } = req.body;
    await query(
      'UPDATE shift_assignments SET employee_id = ?, shift_id = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?',
      [employee_id, shift_id, start_date, end_date, is_active, req.params.id]
    );
    const assignments = await query('SELECT * FROM shift_assignments WHERE id = ?', [req.params.id]);
    res.json(assignments[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shift assignment' });
  }
});

router.delete('/assignments/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM shift_assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift assignment' });
  }
});

// ==================== SHIFT EXCHANGE REQUESTS ====================
router.get('/exchanges/list', async (req, res) => {
  try {
    const exchanges = await query(`
      SELECT ser.*,
             rs.name as requester_shift_name, rs.color as requester_shift_color,
             ts.name as target_shift_name, ts.color as target_shift_color,
             re.employee_id as requester_emp_code, rp.first_name as requester_first_name, rp.last_name as requester_last_name,
             te.employee_id as target_emp_code, tp.first_name as target_first_name, tp.last_name as target_last_name
      FROM shift_exchange_requests ser
      LEFT JOIN shifts rs ON ser.requester_shift_id = rs.id
      LEFT JOIN shifts ts ON ser.target_shift_id = ts.id
      LEFT JOIN employees re ON ser.requester_id = re.id
      LEFT JOIN profiles rp ON re.user_id = rp.user_id
      LEFT JOIN employees te ON ser.target_employee_id = te.id
      LEFT JOIN profiles tp ON te.user_id = tp.user_id
      ORDER BY ser.created_at DESC
    `);
    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shift exchange requests' });
  }
});

router.post('/exchanges', async (req, res) => {
  try {
    const { requester_id, requester_shift_id, target_employee_id, target_shift_id, request_date, reason } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO shift_exchange_requests (id, requester_id, requester_shift_id, target_employee_id, target_shift_id, request_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, requester_id, requester_shift_id, target_employee_id, target_shift_id, request_date, reason, 'pending']
    );
    const exchanges = await query('SELECT * FROM shift_exchange_requests WHERE id = ?', [id]);
    res.status(201).json(exchanges[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shift exchange request' });
  }
});

router.put('/exchanges/:id', async (req, res) => {
  try {
    const { status, response_note } = req.body;
    await query(
      'UPDATE shift_exchange_requests SET status = ?, response_note = ?, responded_at = NOW(), updated_at = NOW() WHERE id = ?',
      [status, response_note, req.params.id]
    );
    const exchanges = await query('SELECT * FROM shift_exchange_requests WHERE id = ?', [req.params.id]);
    res.json(exchanges[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shift exchange request' });
  }
});

router.delete('/exchanges/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM shift_exchange_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift exchange request' });
  }
});

module.exports = router;
