const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/database');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }
    
    // Get user from database
    const users = await query(
      'SELECT id, email, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }
    
    const user = users[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Account is deactivated' 
      });
    }
    
    // Get user role
    const roles = await query(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: roles.length > 0 ? roles[0].role : 'employee'
    };
    
    // Get employee info if exists
    const employees = await query(
      'SELECT id, employee_id FROM employees WHERE user_id = ?',
      [user.id]
    );
    
    if (employees.length > 0) {
      req.user.employeeId = employees[0].id;
      req.user.employeeCode = employees[0].employee_id;
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (decoded) {
      const users = await query(
        'SELECT id, email, is_active FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (users.length > 0 && users[0].is_active) {
        const roles = await query(
          'SELECT role FROM user_roles WHERE user_id = ?',
          [users[0].id]
        );
        
        req.user = {
          id: users[0].id,
          email: users[0].email,
          role: roles.length > 0 ? roles[0].role : 'employee'
        };
        
        const employees = await query(
          'SELECT id, employee_id FROM employees WHERE user_id = ?',
          [users[0].id]
        );
        
        if (employees.length > 0) {
          req.user.employeeId = employees[0].id;
          req.user.employeeCode = employees[0].employee_id;
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
