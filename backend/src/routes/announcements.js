const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/announcements - Get all active announcements
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    
    let sql = `
      SELECT a.*, abt.html_content as banner_html, abt.name as banner_template_name
      FROM announcements a
      LEFT JOIN announcement_banner_templates abt ON a.banner_template_id = abt.id
    `;
    
    // If not requesting all, only show active and non-expired
    if (!all) {
      sql += ` WHERE a.is_active = true 
               AND (a.expires_at IS NULL OR a.expires_at > NOW())
               AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW())`;
    }
    
    sql += ' ORDER BY a.priority DESC, a.published_at DESC';
    
    const announcements = await query(sql);
    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// GET /api/announcements/recent - Get recent announcements with limit
router.get('/recent', async (req, res) => {
  try {
    const { limit } = req.query;
    
    let sql = `
      SELECT a.*, abt.html_content as banner_html
      FROM announcements a
      LEFT JOIN announcement_banner_templates abt ON a.banner_template_id = abt.id
      WHERE a.is_active = true 
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
        AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW())
      ORDER BY a.published_at DESC
    `;
    
    const params = [];
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const announcements = await query(sql, params);
    res.json(announcements);
  } catch (error) {
    console.error('Get recent announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch recent announcements' });
  }
});

// GET /api/announcements/all - Get all announcements (admin)
router.get('/all', requireAdminOrHR, async (req, res) => {
  try {
    const announcements = await query(`
      SELECT a.*, abt.html_content as banner_html, abt.name as banner_template_name
      FROM announcements a
      LEFT JOIN announcement_banner_templates abt ON a.banner_template_id = abt.id
      ORDER BY a.created_at DESC
    `);
    res.json(announcements);
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// GET /api/announcements/:id - Get specific announcement
router.get('/:id', async (req, res) => {
  try {
    const announcements = await query(`
      SELECT a.*, abt.html_content as banner_html
      FROM announcements a
      LEFT JOIN announcement_banner_templates abt ON a.banner_template_id = abt.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (announcements.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcements[0]);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// POST /api/announcements - Create announcement
router.post('/', requireAdminOrHR, async (req, res) => {
  try {
    const { 
      title, content, type, priority, target_audience, 
      is_active, scheduled_at, expires_at, banner_template_id 
    } = req.body;
    
    const id = uuidv4();
    
    await query(
      `INSERT INTO announcements 
       (id, title, content, type, priority, target_audience, is_active, 
        scheduled_at, expires_at, banner_template_id, created_by, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, title, content, type || 'general', priority || 'medium', 
       target_audience || 'all', is_active !== false, 
       scheduled_at || null, expires_at || null, banner_template_id || null, req.user.id]
    );
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// PUT /api/announcements/:id - Update announcement
router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { 
      title, content, type, priority, target_audience, 
      is_active, scheduled_at, expires_at, banner_template_id 
    } = req.body;
    
    await query(
      `UPDATE announcements SET 
       title = COALESCE(?, title),
       content = COALESCE(?, content),
       type = COALESCE(?, type),
       priority = COALESCE(?, priority),
       target_audience = COALESCE(?, target_audience),
       is_active = COALESCE(?, is_active),
       scheduled_at = ?,
       expires_at = ?,
       banner_template_id = ?
       WHERE id = ?`,
      [title, content, type, priority, target_audience, is_active,
       scheduled_at || null, expires_at || null, banner_template_id || null, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
