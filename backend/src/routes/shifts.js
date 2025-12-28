const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => { res.json(await query('SELECT * FROM shifts WHERE is_active = true')); });
router.get('/assignments', async (req, res) => { res.json(await query('SELECT * FROM shift_assignments WHERE is_active = true')); });
router.get('/exchanges', async (req, res) => { res.json(await query('SELECT * FROM shift_exchange_requests ORDER BY created_at DESC')); });
module.exports = router;
