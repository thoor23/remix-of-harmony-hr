const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// ==================== LETTER TEMPLATES ====================
router.get('/letters', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM letter_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch letter templates' });
  }
});

router.get('/letters/:id', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM letter_templates WHERE id = ?', [req.params.id]);
    if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch letter template' });
  }
});

router.post('/letters', requireAdminOrHR, async (req, res) => {
  try {
    const { name, type, content, placeholders, is_default } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO letter_templates (id, name, type, content, placeholders, is_default, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, true, ?)',
      [id, name, type, content, JSON.stringify(placeholders || []), is_default || false, req.user.userId]
    );
    const templates = await query('SELECT * FROM letter_templates WHERE id = ?', [id]);
    res.status(201).json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create letter template' });
  }
});

router.put('/letters/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, type, content, placeholders, is_default, is_active } = req.body;
    await query(
      'UPDATE letter_templates SET name = ?, type = ?, content = ?, placeholders = ?, is_default = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, type, content, JSON.stringify(placeholders || []), is_default, is_active, req.params.id]
    );
    const templates = await query('SELECT * FROM letter_templates WHERE id = ?', [req.params.id]);
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update letter template' });
  }
});

router.delete('/letters/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM letter_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete letter template' });
  }
});

// ==================== EMAIL TEMPLATES ====================
router.get('/emails', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM email_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

router.get('/emails/:id', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

router.post('/emails', requireAdminOrHR, async (req, res) => {
  try {
    const { name, type, subject, content, placeholders, is_default } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO email_templates (id, name, type, subject, content, placeholders, is_default, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, true, ?)',
      [id, name, type, subject, content, JSON.stringify(placeholders || []), is_default || false, req.user.userId]
    );
    const templates = await query('SELECT * FROM email_templates WHERE id = ?', [id]);
    res.status(201).json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create email template' });
  }
});

router.put('/emails/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, type, subject, content, placeholders, is_default, is_active } = req.body;
    await query(
      'UPDATE email_templates SET name = ?, type = ?, subject = ?, content = ?, placeholders = ?, is_default = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, type, subject, content, JSON.stringify(placeholders || []), is_default, is_active, req.params.id]
    );
    const templates = await query('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

router.delete('/emails/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM email_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

// ==================== PAYSLIP TEMPLATES ====================
router.get('/payslips', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM payslip_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payslip templates' });
  }
});

router.get('/payslips/:id', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM payslip_templates WHERE id = ?', [req.params.id]);
    if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payslip template' });
  }
});

router.post('/payslips', requireAdminOrHR, async (req, res) => {
  try {
    const { name, content, company_name, company_address, company_logo_url, footer_text, layout_config, is_default } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO payslip_templates (id, name, content, company_name, company_address, company_logo_url, footer_text, layout_config, is_default, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?)',
      [id, name, content, company_name, company_address, company_logo_url, footer_text, JSON.stringify(layout_config || {}), is_default || false, req.user.userId]
    );
    const templates = await query('SELECT * FROM payslip_templates WHERE id = ?', [id]);
    res.status(201).json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payslip template' });
  }
});

router.put('/payslips/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, content, company_name, company_address, company_logo_url, footer_text, layout_config, is_default, is_active } = req.body;
    await query(
      'UPDATE payslip_templates SET name = ?, content = ?, company_name = ?, company_address = ?, company_logo_url = ?, footer_text = ?, layout_config = ?, is_default = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, content, company_name, company_address, company_logo_url, footer_text, JSON.stringify(layout_config || {}), is_default, is_active, req.params.id]
    );
    const templates = await query('SELECT * FROM payslip_templates WHERE id = ?', [req.params.id]);
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payslip template' });
  }
});

router.delete('/payslips/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM payslip_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payslip template' });
  }
});

// ==================== ANNOUNCEMENT TEMPLATES ====================
router.get('/announcements', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM announcement_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement templates' });
  }
});

router.get('/announcements/:id', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM announcement_templates WHERE id = ?', [req.params.id]);
    if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcement template' });
  }
});

router.post('/announcements', requireAdminOrHR, async (req, res) => {
  try {
    const { name, title, content, type, priority, target_audience, is_default } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO announcement_templates (id, name, title, content, type, priority, target_audience, is_default, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, ?)',
      [id, name, title, content, type || 'general', priority || 'normal', target_audience || 'all', is_default || false, req.user.userId]
    );
    const templates = await query('SELECT * FROM announcement_templates WHERE id = ?', [id]);
    res.status(201).json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement template' });
  }
});

router.put('/announcements/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, title, content, type, priority, target_audience, is_default, is_active } = req.body;
    await query(
      'UPDATE announcement_templates SET name = ?, title = ?, content = ?, type = ?, priority = ?, target_audience = ?, is_default = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, title, content, type, priority, target_audience, is_default, is_active, req.params.id]
    );
    const templates = await query('SELECT * FROM announcement_templates WHERE id = ?', [req.params.id]);
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update announcement template' });
  }
});

router.delete('/announcements/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM announcement_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement template' });
  }
});

// ==================== BANNER TEMPLATES ====================
router.get('/banners', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM announcement_banner_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banner templates' });
  }
});

router.get('/banners/:id', async (req, res) => {
  try {
    const templates = await query('SELECT * FROM announcement_banner_templates WHERE id = ?', [req.params.id]);
    if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch banner template' });
  }
});

router.post('/banners', requireAdminOrHR, async (req, res) => {
  try {
    const { name, html_content, priority_type, is_default } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO announcement_banner_templates (id, name, html_content, priority_type, is_default, is_active, created_by) VALUES (?, ?, ?, ?, ?, true, ?)',
      [id, name, html_content, priority_type || 'normal', is_default || false, req.user.userId]
    );
    const templates = await query('SELECT * FROM announcement_banner_templates WHERE id = ?', [id]);
    res.status(201).json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create banner template' });
  }
});

router.put('/banners/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, html_content, priority_type, is_default, is_active } = req.body;
    await query(
      'UPDATE announcement_banner_templates SET name = ?, html_content = ?, priority_type = ?, is_default = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, html_content, priority_type, is_default, is_active, req.params.id]
    );
    const templates = await query('SELECT * FROM announcement_banner_templates WHERE id = ?', [req.params.id]);
    res.json(templates[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update banner template' });
  }
});

router.delete('/banners/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM announcement_banner_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete banner template' });
  }
});

// ==================== GENERATED LETTERS ====================
router.get('/generated-letters', async (req, res) => {
  try {
    const letters = await query(`
      SELECT gl.*, e.employee_id as emp_code, p.first_name, p.last_name
      FROM generated_letters gl
      LEFT JOIN employees e ON gl.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      ORDER BY gl.created_at DESC
    `);
    res.json(letters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generated letters' });
  }
});

router.post('/generated-letters', requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, type, content, template_id, metadata, file_url, status } = req.body;
    const id = require('crypto').randomUUID();
    await query(
      'INSERT INTO generated_letters (id, employee_id, type, content, template_id, metadata, file_url, status, generated_by, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [id, employee_id, type, content, template_id, JSON.stringify(metadata || {}), file_url, status || 'draft', req.user.userId]
    );
    const letters = await query('SELECT * FROM generated_letters WHERE id = ?', [id]);
    res.status(201).json(letters[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create generated letter' });
  }
});

router.put('/generated-letters/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { content, file_url, status, metadata } = req.body;
    await query(
      'UPDATE generated_letters SET content = ?, file_url = ?, status = ?, metadata = ? WHERE id = ?',
      [content, file_url, status, JSON.stringify(metadata || {}), req.params.id]
    );
    const letters = await query('SELECT * FROM generated_letters WHERE id = ?', [req.params.id]);
    res.json(letters[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update generated letter' });
  }
});

router.delete('/generated-letters/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM generated_letters WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete generated letter' });
  }
});

module.exports = router;
