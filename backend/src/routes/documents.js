const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

router.use(authenticate);

// Get all documents
router.get('/', async (req, res) => {
  try {
    const { employee_id, is_company_document, folder_path, document_category } = req.query;
    let sql = `
      SELECT d.*, e.employee_id as emp_code, p.first_name, p.last_name
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      sql += ' AND d.employee_id = ?';
      params.push(employee_id);
    }
    if (is_company_document !== undefined) {
      sql += ' AND d.is_company_document = ?';
      params.push(is_company_document === 'true');
    }
    if (folder_path) {
      sql += ' AND d.folder_path = ?';
      params.push(folder_path);
    }
    if (document_category) {
      sql += ' AND d.document_category = ?';
      params.push(document_category);
    }

    sql += ' ORDER BY d.created_at DESC';
    const documents = await query(sql, params);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const documents = await query(`
      SELECT d.*, e.employee_id as emp_code, p.first_name, p.last_name
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE d.id = ?
    `, [req.params.id]);
    if (documents.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(documents[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Upload document
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { name, type, employee_id, is_company_document, folder_path, document_category } = req.body;
    const id = require('crypto').randomUUID();
    
    let file_url = null;
    let file_size = null;
    
    if (req.file) {
      file_url = `/uploads/documents/${req.file.filename}`;
      file_size = req.file.size;
    }

    await query(
      'INSERT INTO documents (id, name, type, file_url, file_size, employee_id, is_company_document, folder_path, document_category, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, type, file_url, file_size, employee_id || null, is_company_document === 'true', folder_path || null, document_category || null, req.user.userId]
    );
    
    const documents = await query('SELECT * FROM documents WHERE id = ?', [id]);
    res.status(201).json(documents[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Update document
router.put('/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { name, type, folder_path, document_category } = req.body;
    await query(
      'UPDATE documents SET name = ?, type = ?, folder_path = ?, document_category = ? WHERE id = ?',
      [name, type, folder_path, document_category, req.params.id]
    );
    const documents = await query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    res.json(documents[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', requireAdminOrHR, async (req, res) => {
  try {
    // Get file path before deleting
    const documents = await query('SELECT file_url FROM documents WHERE id = ?', [req.params.id]);
    if (documents.length > 0 && documents[0].file_url) {
      const filePath = path.join(__dirname, '../..', documents[0].file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get employee folders (unique folder paths)
router.get('/folders/list', async (req, res) => {
  try {
    const folders = await query(`
      SELECT DISTINCT folder_path, COUNT(*) as document_count
      FROM documents
      WHERE folder_path IS NOT NULL
      GROUP BY folder_path
      ORDER BY folder_path
    `);
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Download document file
router.get('/download/:id', async (req, res) => {
  try {
    const documents = await query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (documents.length === 0) return res.status(404).json({ error: 'Document not found' });
    
    const doc = documents[0];
    if (!doc.file_url) return res.status(404).json({ error: 'File not found' });
    
    const filePath = path.join(__dirname, '../..', doc.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.download(filePath, doc.name);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Get my documents (for employee)
router.get('/my/list', async (req, res) => {
  try {
    const employees = await query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
    if (employees.length === 0) return res.json([]);
    
    const documents = await query(`
      SELECT d.* FROM documents d
      WHERE d.employee_id = ? OR d.is_company_document = true
      ORDER BY d.created_at DESC
    `, [employees[0].id]);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch my documents' });
  }
});

// Get documents by category
router.get('/category/:category', async (req, res) => {
  try {
    const documents = await query(`
      SELECT d.*, e.employee_id as emp_code, p.first_name, p.last_name
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE d.document_category = ?
      ORDER BY d.created_at DESC
    `, [req.params.category]);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents by category' });
  }
});

module.exports = router;
