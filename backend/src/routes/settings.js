const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/branding');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for branding uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const type = req.body.type || 'file';
    cb(null, `${type}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// PUBLIC ROUTES (no auth required)
// GET /api/settings/public/branding - Get company branding without authentication
router.get('/public/branding', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['company_branding']);
    
    const defaultBranding = {
      companyName: 'HRMS Portal',
      companyLogo: null,
      companyFavicon: null,
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      companyWebsite: '',
      logoSize: 32,
      nameSize: 18,
      nameFontWeight: 'semibold',
      nameItalic: false,
    };
    
    if (settings.length === 0) {
      return res.json({ value: defaultBranding });
    }
    
    let branding = settings[0].value;
    if (typeof branding === 'string') {
      try {
        branding = JSON.parse(branding);
      } catch {
        branding = defaultBranding;
      }
    }
    
    res.json({ value: { ...defaultBranding, ...branding } });
  } catch (error) {
    console.error('Get public branding error:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

// PROTECTED ROUTES (auth required)
router.use(authenticate);

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM system_settings ORDER BY category');
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/settings/:key - Get single setting by key
router.get('/:key', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', [req.params.key]);
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    // Parse JSON value
    const setting = settings[0];
    if (setting.value && typeof setting.value === 'string') {
      try {
        setting.value = JSON.parse(setting.value);
      } catch {}
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT /api/settings/:key - Update setting
router.put('/:key', requireAdminOrHR, async (req, res) => {
  try {
    const { value } = req.body;
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Check if setting exists
    const existing = await query('SELECT id FROM system_settings WHERE `key` = ?', [req.params.key]);
    
    if (existing.length === 0) {
      // Create new setting
      const id = uuidv4();
      await query(
        'INSERT INTO system_settings (id, `key`, value, category) VALUES (?, ?, ?, ?)',
        [id, req.params.key, valueStr, 'general']
      );
    } else {
      // Update existing
      await query(
        'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
        [valueStr, req.params.key]
      );
    }
    
    res.json({ message: 'Setting updated' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// POST /api/settings/branding/upload - Upload logo or favicon
router.post('/branding/upload', requireAdminOrHR, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = req.body.type; // 'logo' or 'favicon'
    const fileUrl = `/uploads/branding/${req.file.filename}`;
    
    // Get current branding
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['company_branding']);
    let branding = {
      companyName: 'HRMS Portal',
      companyLogo: null,
      favicon: null,
      primaryColor: '#6366f1',
      accentColor: '#f59e0b',
      supportEmail: '',
      supportPhone: '',
      address: '',
      website: '',
    };
    
    if (settings.length > 0 && settings[0].value) {
      try {
        branding = typeof settings[0].value === 'string' 
          ? JSON.parse(settings[0].value) 
          : settings[0].value;
      } catch {}
    }
    
    // Delete old file if exists
    const oldUrl = type === 'logo' ? branding.companyLogo : branding.favicon;
    if (oldUrl) {
      const oldPath = path.join(__dirname, '../..', oldUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Update branding
    if (type === 'logo') {
      branding.companyLogo = fileUrl;
    } else {
      branding.favicon = fileUrl;
    }
    
    // Save to database
    if (settings.length === 0) {
      await query(
        'INSERT INTO system_settings (id, `key`, value, category) VALUES (?, ?, ?, ?)',
        [uuidv4(), 'company_branding', JSON.stringify(branding), 'branding']
      );
    } else {
      await query(
        'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
        [JSON.stringify(branding), 'company_branding']
      );
    }
    
    res.json({ url: fileUrl, branding });
  } catch (error) {
    console.error('Upload branding error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /api/settings/branding/logo - Delete company logo
router.delete('/branding/logo', requireAdminOrHR, async (req, res) => {
  try {
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['company_branding']);
    if (settings.length === 0) {
      return res.json({ message: 'No logo to delete' });
    }
    
    let branding = typeof settings[0].value === 'string' 
      ? JSON.parse(settings[0].value) 
      : settings[0].value;
    
    if (branding.companyLogo) {
      const filePath = path.join(__dirname, '../..', branding.companyLogo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      branding.companyLogo = null;
      
      await query(
        'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
        [JSON.stringify(branding), 'company_branding']
      );
    }
    
    res.json({ message: 'Logo deleted' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
});

// DELETE /api/settings/branding/favicon - Delete favicon
router.delete('/branding/favicon', requireAdminOrHR, async (req, res) => {
  try {
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['company_branding']);
    if (settings.length === 0) {
      return res.json({ message: 'No favicon to delete' });
    }
    
    let branding = typeof settings[0].value === 'string' 
      ? JSON.parse(settings[0].value) 
      : settings[0].value;
    
    if (branding.favicon) {
      const filePath = path.join(__dirname, '../..', branding.favicon);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      branding.favicon = null;
      
      await query(
        'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
        [JSON.stringify(branding), 'company_branding']
      );
    }
    
    res.json({ message: 'Favicon deleted' });
  } catch (error) {
    console.error('Delete favicon error:', error);
    res.status(500).json({ error: 'Failed to delete favicon' });
  }
});

module.exports = router;
