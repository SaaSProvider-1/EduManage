import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive or suspended'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Update last active timestamp
    // Update last active timestamp - FIXED: Handle address conversion
try {
  // Check if user has string address and convert it first
  if (user.address && typeof user.address === 'string') {
     await User.updateOne(
      { _id: user._id },
      {
        $set: {
          address: {
            street: user.address,
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          }
        }
      }
    );
    await User.updateOne(
      { _id: user._id },
      { $set: { lastActive: new Date() } }
    );
  } else {
    // Normal update for users with proper address structure
    await User.updateOne(
      { _id: user._id },
      { $set: { lastActive: new Date() } }
    );
    await user.save({ validateBeforeSave: false });
  }
} catch (updateError) {
  // Log the error but don't fail authentication
  console.error('Failed to update lastActive:', updateError);
}

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Role-based authorization
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Check if user owns resource or is admin
export const authorizeResourceOwner = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req[resourceUserField] || req.body[resourceUserField] || req.params[resourceUserField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
        // Update last active timestamp - FIXED: Handle address conversion
try {
  if (user.address && typeof user.address === 'string') {
    await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  address: {
                    street: user.address,
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'India'
                  }
                }
              }
            );
            await User.updateOne(
              { _id: user._id },
              { $set: { lastActive: new Date() } }
            );
  } else {
    await User.updateOne(
              { _id: user._id },
              { $set: { lastActive: new Date() } }
            );
    await user.save({ validateBeforeSave: false });
  }
} catch (updateError) {
  // Log the error but don't fail authentication
  console.error('Failed to update lastActive in optionalAuth:', updateError);
}
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Refresh token middleware
export const authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Email verification required middleware
export const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresVerification: true
    });
  }
  next();
};

// Check user permissions for specific actions
export const checkPermission = (action, resource) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Define permission matrix
    const permissions = {
      admin: {
        users: ['create', 'read', 'update', 'delete'],
        batches: ['create', 'read', 'update', 'delete'],
        attendance: ['create', 'read', 'update', 'delete'],
        fees: ['create', 'read', 'update', 'delete'],
        exams: ['create', 'read', 'update', 'delete'],
        notifications: ['create', 'read', 'update', 'delete'],
        reports: ['read']
      },
      teacher: {
        users: ['read'],
        batches: ['read'],
        attendance: ['create', 'read', 'update'],
        fees: ['read'],
        exams: ['create', 'read', 'update'],
        notifications: ['create', 'read'],
        reports: ['read']
      },
      student: {
        users: ['read'],
        batches: ['read'],
        attendance: ['read'],
        fees: ['read'],
        exams: ['read'],
        notifications: ['read']
      },
      parent: {
        users: ['read'],
        batches: ['read'],
        attendance: ['read'],
        fees: ['read'],
        exams: ['read'],
        notifications: ['read']
      }
    };

    const userPermissions = permissions[req.user.role];
    if (!userPermissions || !userPermissions[resource] || !userPermissions[resource].includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Insufficient permissions for ${action} on ${resource}`
      });
    }

    next();
  };
};