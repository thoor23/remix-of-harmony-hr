const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const users = await query('SELECT id, email FROM users WHERE email = ?', [email]);
    
    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({ message: 'If an account exists, a reset email will be sent' });
    }
    
    const user = users[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    // Store reset token (you might want a separate table for this)
    await query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );
    
    // Try to send email via email service
    try {
      const nodemailer = require('nodemailer');
      const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['email_config']);
      
      if (settings.length > 0) {
        const config = typeof settings[0].value === 'string' 
          ? JSON.parse(settings[0].value) 
          : settings[0].value;
        
        if (config.enabled && config.smtpHost) {
          const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
              user: config.smtpUser,
              pass: config.smtpPassword,
            },
          });
          
          const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth#type=recovery&token=${resetToken}`;
          
          await transporter.sendMail({
            from: `"${config.fromName || 'HRMS'}" <${config.fromEmail}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
              <h1>Password Reset</h1>
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <a href="${resetUrl}">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            `,
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't fail the request if email fails - token is still created
    }
    
    res.json({ message: 'If an account exists, a reset email will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    // Find user with valid reset token
    const users = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const user = users[0];
    const passwordHash = await hashPassword(password);
    
    // Update password and clear reset token
    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
