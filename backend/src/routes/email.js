const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrHR } = require('../middleware/roleCheck');

router.use(authenticate);

// POST /api/email/test - Send test email
router.post('/test', requireAdminOrHR, async (req, res) => {
  try {
    const { to, config } = req.body;
    
    if (!to || !config) {
      return res.status(400).json({ error: 'Missing recipient or config' });
    }

    let transporter;
    
    if (config.provider === 'smtp') {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });
    } else {
      // For Resend, we'd need to use their API
      return res.status(400).json({ error: 'Resend provider not implemented in backend. Use SMTP.' });
    }
    
    await transporter.sendMail({
      from: `"${config.fromName || 'HRMS'}" <${config.fromEmail}>`,
      to,
      subject: 'Test Email from HRMS',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your HRMS system.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
    });
    
    // Update last test status
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['email_config']);
    if (settings.length > 0) {
      let emailConfig = typeof settings[0].value === 'string' 
        ? JSON.parse(settings[0].value) 
        : settings[0].value;
      
      emailConfig.lastTestedAt = new Date().toISOString();
      emailConfig.lastTestStatus = 'success';
      emailConfig.lastTestMessage = 'Test email sent successfully';
      
      await query(
        'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
        [JSON.stringify(emailConfig), 'email_config']
      );
    }
    
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Send test email error:', error);
    
    // Update last test status with failure
    try {
      const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['email_config']);
      if (settings.length > 0) {
        let emailConfig = typeof settings[0].value === 'string' 
          ? JSON.parse(settings[0].value) 
          : settings[0].value;
        
        emailConfig.lastTestedAt = new Date().toISOString();
        emailConfig.lastTestStatus = 'failed';
        emailConfig.lastTestMessage = error.message;
        
        await query(
          'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
          [JSON.stringify(emailConfig), 'email_config']
        );
      }
    } catch {}
    
    res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
});

// POST /api/email/send - Send email (for password reset, notifications, etc.)
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    // Get email config
    const settings = await query('SELECT * FROM system_settings WHERE `key` = ?', ['email_config']);
    if (settings.length === 0) {
      return res.status(400).json({ error: 'Email not configured' });
    }
    
    const config = typeof settings[0].value === 'string' 
      ? JSON.parse(settings[0].value) 
      : settings[0].value;
    
    if (!config.enabled) {
      return res.status(400).json({ error: 'Email is disabled' });
    }
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
    
    await transporter.sendMail({
      from: `"${config.fromName || 'HRMS'}" <${config.fromEmail}>`,
      replyTo: config.replyToEmail || config.fromEmail,
      to,
      subject,
      html,
      text,
    });
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
