const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
router.use(authenticate);
router.use(requireAdmin);
router.get('/', async (req, res) => { res.json(await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')); });
module.exports = router;
