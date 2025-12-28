const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', async (req, res) => {
  try { res.json(await query('SELECT * FROM designations ORDER BY name')); }
  catch (e) { res.status(500).json({ error: 'Failed' }); }
});
module.exports = router;
