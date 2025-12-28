const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => { res.json(await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id])); });
router.put('/:id/read', async (req, res) => { await query('UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]); res.json({ success: true }); });
module.exports = router;
