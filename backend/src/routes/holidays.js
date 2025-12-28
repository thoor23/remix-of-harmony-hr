const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => { res.json(await query('SELECT * FROM holidays ORDER BY date')); });
module.exports = router;
