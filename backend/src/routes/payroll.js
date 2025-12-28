const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// ==================== PAYSLIPS ====================

// GET /api/payroll/payslips - Get all payslips (admin/HR)
router.get('/payslips', requireAdminOrHR, async (req, res) => {
  try {
    const { month, status } = req.query;
    
    let sql = `
      SELECT ps.*, e.employee_id as emp_code, p.first_name, p.last_name,
             d.name as department_name
      FROM payslips ps
      LEFT JOIN employees e ON ps.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (month) {
      conditions.push('ps.pay_period = ?');
      params.push(month);
    }
    
    if (status) {
      conditions.push('ps.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY ps.pay_date DESC';
    
    const payslips = await query(sql, params);
    res.json(payslips);
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// GET /api/payroll/payslips/my - Get current user's payslips
router.get('/payslips/my', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json([]);
    }
    
    const payslips = await query(`
      SELECT * FROM payslips 
      WHERE employee_id = ?
      ORDER BY pay_date DESC
    `, [req.user.employeeId]);
    
    res.json(payslips);
  } catch (error) {
    console.error('Get my payslips error:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// GET /api/payroll/payslips/employee/:id - Get employee's payslips
router.get('/payslips/employee/:id', async (req, res) => {
  try {
    const payslips = await query(`
      SELECT * FROM payslips 
      WHERE employee_id = ?
      ORDER BY pay_date DESC
    `, [req.params.id]);
    
    res.json(payslips);
  } catch (error) {
    console.error('Get employee payslips error:', error);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// GET /api/payroll/payslips/:id - Get specific payslip
router.get('/payslips/:id', async (req, res) => {
  try {
    const payslips = await query(`
      SELECT ps.*, e.employee_id as emp_code, p.first_name, p.last_name,
             d.name as department_name, des.name as designation_name
      FROM payslips ps
      LEFT JOIN employees e ON ps.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE ps.id = ?
    `, [req.params.id]);
    
    if (payslips.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    res.json(payslips[0]);
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ error: 'Failed to fetch payslip' });
  }
});

// POST /api/payroll/payslips - Generate payslip
router.post('/payslips', requireAdminOrHR, async (req, res) => {
  try {
    const { employee_id, pay_period, pay_date } = req.body;
    
    // Get salary structure for employee
    const structures = await query(
      'SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1',
      [employee_id]
    );
    
    if (structures.length === 0) {
      return res.status(400).json({ error: 'No salary structure found for employee' });
    }
    
    const salary = structures[0];
    
    // Calculate payslip values
    const basicSalary = parseFloat(salary.basic_salary) || 0;
    const hra = parseFloat(salary.hra) || 0;
    const transportAllowance = parseFloat(salary.transport_allowance) || 0;
    const medicalAllowance = parseFloat(salary.medical_allowance) || 0;
    const otherAllowances = parseFloat(salary.other_allowances) || 0;
    
    const pfDeduction = parseFloat(salary.pf_deduction) || 0;
    const taxDeduction = parseFloat(salary.tax_deduction) || 0;
    const otherDeductions = parseFloat(salary.other_deductions) || 0;
    
    const grossEarnings = basicSalary + hra + transportAllowance + medicalAllowance + otherAllowances;
    const totalDeductions = pfDeduction + taxDeduction + otherDeductions;
    const netPay = grossEarnings - totalDeductions;
    
    const id = uuidv4();
    
    await query(
      `INSERT INTO payslips 
       (id, employee_id, pay_period, pay_date, basic_salary, gross_earnings, total_deductions, net_pay, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [id, employee_id, pay_period, pay_date, basicSalary, grossEarnings, totalDeductions, netPay]
    );
    
    res.status(201).json({ 
      id, 
      basic_salary: basicSalary,
      gross_earnings: grossEarnings, 
      total_deductions: totalDeductions, 
      net_pay: netPay 
    });
  } catch (error) {
    console.error('Generate payslip error:', error);
    res.status(500).json({ error: 'Failed to generate payslip' });
  }
});

// PUT /api/payroll/payslips/:id - Update payslip
router.put('/payslips/:id', requireAdminOrHR, async (req, res) => {
  try {
    const { basic_salary, gross_earnings, total_deductions, net_pay, status } = req.body;
    
    await query(
      `UPDATE payslips SET 
       basic_salary = COALESCE(?, basic_salary),
       gross_earnings = COALESCE(?, gross_earnings),
       total_deductions = COALESCE(?, total_deductions),
       net_pay = COALESCE(?, net_pay),
       status = COALESCE(?, status)
       WHERE id = ?`,
      [basic_salary, gross_earnings, total_deductions, net_pay, status, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update payslip error:', error);
    res.status(500).json({ error: 'Failed to update payslip' });
  }
});

// DELETE /api/payroll/payslips/:id - Delete payslip
router.delete('/payslips/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM payslips WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete payslip error:', error);
    res.status(500).json({ error: 'Failed to delete payslip' });
  }
});

// ==================== SALARY STRUCTURES ====================

// GET /api/payroll/salary-structures - Get all salary structures
router.get('/salary-structures', requireAdminOrHR, async (req, res) => {
  try {
    const structures = await query(`
      SELECT ss.*, e.employee_id as emp_code, p.first_name, p.last_name,
             d.name as department_name
      FROM salary_structures ss
      LEFT JOIN employees e ON ss.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY ss.created_at DESC
    `);
    res.json(structures);
  } catch (error) {
    console.error('Get salary structures error:', error);
    res.status(500).json({ error: 'Failed to fetch salary structures' });
  }
});

// GET /api/payroll/salary-structures/my - Get current user's salary structure
router.get('/salary-structures/my', async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.json(null);
    }
    
    const structures = await query(
      'SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1',
      [req.user.employeeId]
    );
    
    res.json(structures[0] || null);
  } catch (error) {
    console.error('Get my salary structure error:', error);
    res.status(500).json({ error: 'Failed to fetch salary structure' });
  }
});

// GET /api/payroll/salary-structures/employee/:id - Get employee's salary structure
router.get('/salary-structures/employee/:id', async (req, res) => {
  try {
    const structures = await query(
      'SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC',
      [req.params.id]
    );
    
    res.json(structures);
  } catch (error) {
    console.error('Get employee salary structure error:', error);
    res.status(500).json({ error: 'Failed to fetch salary structure' });
  }
});

// GET /api/payroll/salary-structures/:id - Get specific salary structure
router.get('/salary-structures/:id', async (req, res) => {
  try {
    const structures = await query('SELECT * FROM salary_structures WHERE id = ?', [req.params.id]);
    
    if (structures.length === 0) {
      return res.status(404).json({ error: 'Salary structure not found' });
    }
    
    res.json(structures[0]);
  } catch (error) {
    console.error('Get salary structure error:', error);
    res.status(500).json({ error: 'Failed to fetch salary structure' });
  }
});

// POST /api/payroll/salary-structures - Create salary structure
router.post('/salary-structures', requireAdminOrHR, async (req, res) => {
  try {
    const {
      employee_id, basic_salary, hra, transport_allowance, medical_allowance,
      other_allowances, pf_deduction, tax_deduction, other_deductions, effective_from
    } = req.body;
    
    const id = uuidv4();
    
    await query(
      `INSERT INTO salary_structures 
       (id, employee_id, basic_salary, hra, transport_allowance, medical_allowance,
        other_allowances, pf_deduction, tax_deduction, other_deductions, effective_from)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, employee_id, basic_salary || 0, hra || 0, transport_allowance || 0,
       medical_allowance || 0, other_allowances || 0, pf_deduction || 0,
       tax_deduction || 0, other_deductions || 0, effective_from || new Date().toISOString().split('T')[0]]
    );
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create salary structure error:', error);
    res.status(500).json({ error: 'Failed to create salary structure' });
  }
});

// PUT /api/payroll/salary-structures/:id - Update salary structure
router.put('/salary-structures/:id', requireAdminOrHR, async (req, res) => {
  try {
    const {
      basic_salary, hra, transport_allowance, medical_allowance,
      other_allowances, pf_deduction, tax_deduction, other_deductions, effective_from
    } = req.body;
    
    await query(
      `UPDATE salary_structures SET 
       basic_salary = COALESCE(?, basic_salary),
       hra = COALESCE(?, hra),
       transport_allowance = COALESCE(?, transport_allowance),
       medical_allowance = COALESCE(?, medical_allowance),
       other_allowances = COALESCE(?, other_allowances),
       pf_deduction = COALESCE(?, pf_deduction),
       tax_deduction = COALESCE(?, tax_deduction),
       other_deductions = COALESCE(?, other_deductions),
       effective_from = COALESCE(?, effective_from),
       updated_at = NOW()
       WHERE id = ?`,
      [basic_salary, hra, transport_allowance, medical_allowance,
       other_allowances, pf_deduction, tax_deduction, other_deductions, effective_from, req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update salary structure error:', error);
    res.status(500).json({ error: 'Failed to update salary structure' });
  }
});

// DELETE /api/payroll/salary-structures/:id - Delete salary structure
router.delete('/salary-structures/:id', requireAdminOrHR, async (req, res) => {
  try {
    await query('DELETE FROM salary_structures WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete salary structure error:', error);
    res.status(500).json({ error: 'Failed to delete salary structure' });
  }
});

module.exports = router;
