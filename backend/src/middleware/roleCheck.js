/**
 * Role-based access control middleware
 */

/**
 * Check if user has one of the required roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to perform this action' 
      });
    }
    
    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required' 
    });
  }
  
  next();
};

/**
 * Check if user is admin or HR
 */
const requireAdminOrHR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin or HR access required' 
    });
  }
  
  next();
};

/**
 * Check if user is admin, HR, or manager
 */
const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  
  if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Manager access required' 
    });
  }
  
  next();
};

/**
 * Check if user owns the resource or has admin/HR access
 */
const requireOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    // Admin and HR can access any resource
    if (['admin', 'hr'].includes(req.user.role)) {
      return next();
    }
    
    try {
      const ownerId = await getOwnerId(req);
      
      // Check if user is the owner
      if (ownerId === req.user.id || ownerId === req.user.employeeId) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not have permission to access this resource' 
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to verify resource ownership' 
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireAdminOrHR,
  requireManager,
  requireOwnerOrAdmin
};
