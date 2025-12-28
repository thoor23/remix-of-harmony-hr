const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const isValid = await comparePassword(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    // Get role and profile
    const roles = await query('SELECT role FROM user_roles WHERE user_id = ?', [user.id]);
    const profiles = await query('SELECT * FROM profiles WHERE user_id = ?', [user.id]);
    const employees = await query('SELECT id, employee_id FROM employees WHERE user_id = ?', [user.id]);
    
    const role = roles.length > 0 ? roles[0].role : 'employee';
    const profile = profiles.length > 0 ? profiles[0] : null;
    const employee = employees.length > 0 ? employees[0] : null;
    
    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role });
    const refreshToken = generateRefreshToken({ userId: user.id });
    
    // Update last sign in
    await query('UPDATE users SET last_sign_in_at = NOW() WHERE id = ?', [user.id]);
    
    res.json({
      user: { id: user.id, email: user.email, role, profile, employeeId: employee?.id },
      session: { access_token: accessToken, refresh_token: refreshToken }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register (admin only creates users)
router.post('/register', authenticate, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'employee' } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Only admin/HR can create users' });
    }
    
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    
    await query('INSERT INTO users (id, email, password_hash, email_confirmed_at) VALUES (?, ?, ?, NOW())', 
      [userId, email, passwordHash]);
    await query('INSERT INTO profiles (id, user_id, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, firstName, lastName, email]);
    await query('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), userId, role]);
    
    res.status(201).json({ message: 'User created', userId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const profiles = await query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const employees = await query('SELECT * FROM employees WHERE user_id = ?', [req.user.id]);
    
    res.json({
      user: { id: req.user.id, email: req.user.email, role: req.user.role },
      profile: profiles[0] || null,
      employee: employees[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const decoded = verifyRefreshToken(refresh_token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const users = await query('SELECT id, email FROM users WHERE id = ? AND is_active = true', [decoded.userId]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const roles = await query('SELECT role FROM user_roles WHERE user_id = ?', [decoded.userId]);
    const role = roles.length > 0 ? roles[0].role : 'employee';
    
    const accessToken = generateAccessToken({ userId: decoded.userId, email: users[0].email, role });
    res.json({ access_token: accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
