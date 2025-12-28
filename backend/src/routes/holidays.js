const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/holidays - Get all holidays
router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    
    let sql = 'SELECT * FROM holidays';
    const params = [];
    
    if (year) {
      sql += ' WHERE YEAR(date) = ?';
      params.push(parseInt(year));
    }
    
    sql += ' ORDER BY date';
    
    const holidays = await query(sql, params);
    res.json(holidays);
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// GET /api/holidays/upcoming - Get upcoming holidays
router.get('/upcoming', async (req, res) => {
  try {
    const { limit } = req.query;
    
    let sql = 'SELECT * FROM holidays WHERE date >= CURDATE() ORDER BY date';
    const params = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const holidays = await query(sql, params);
    res.json(holidays);
  } catch (error) {
    console.error('Get upcoming holidays error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming holidays' });
  }
});

// GET /api/holidays/:id - Get specific holiday
router.get('/:id', async (req, res) => {
  try {
    const holidays = await query('SELECT * FROM holidays WHERE id = ?', [req.params.id]);
    
    if (holidays.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    res.json(holidays[0]);
  } catch (error) {
    console.error('Get holiday error:', error);
    res.status(500).json({ error: 'Failed to fetch holiday' });
  }
});

// POST /api/holidays - Create holiday
router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const { name, date, type, description, is_optional } = req.body;
    
    // Check if holiday already exists on this date
    const existing = await query('SELECT id FROM holidays WHERE date = ?', [date]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A holiday already exists on this date' });
    }
    
    const id = uuidv4();
    
    await query(
      'INSERT INTO holidays (id, name, date, type, description, is_optional) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, date, type || 'public', description || null, is_optional || false]
    );
    
    res.status(201).json({ id, name, date, type, description, is_optional });
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// PUT /api/holidays/:id - Update holiday
router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, date, type, description, is_optional } = req.body;
    
    // Check if another holiday exists on new date
    if (date) {
      const existing = await query('SELECT id FROM holidays WHERE date = ? AND id != ?', [date, req.params.id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A holiday already exists on this date' });
      }
    }
    
    await query(
      `UPDATE holidays SET 
       name = COALESCE(?, name),
       date = COALESCE(?, date),
       type = COALESCE(?, type),
       description = ?,
       is_optional = COALESCE(?, is_optional)
       WHERE id = ?`,
      [name, date, type, description || null, is_optional, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// DELETE /api/holidays/:id - Delete holiday
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM holidays WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;
