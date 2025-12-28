const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/payslips', async (req, res) => { res.json(await query('SELECT * FROM payslips ORDER BY pay_date DESC')); });
router.get('/salary-structures', async (req, res) => { res.json(await query('SELECT * FROM salary_structures')); });
module.exports = router;
