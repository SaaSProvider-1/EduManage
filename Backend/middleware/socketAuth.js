import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocketAuth = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        throw new Error('Authentication token required');
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'active') {
        throw new Error('User account is inactive');
      }

      if (user.isLocked) {
        throw new Error('User account is locked');
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;

      // Update last active timestamp
      user.lastActive = new Date();
      await user.save({ validateBeforeSave: false });

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });
};

// Socket middleware for role-based authorization
export const socketAuthorizeRoles = (...roles) => {
  return (socket, next) => {
    if (!roles.includes(socket.userRole)) {
      next(new Error(`Access denied. Required role: ${roles.join(' or ')}`));
    } else {
      next();
    }
  };
};

// Socket middleware for resource ownership
export const socketAuthorizeResource = (getResourceUserId) => {
  return async (socket, data, next) => {
    try {
      const resourceUserId = await getResourceUserId(data);
      
      if (socket.userRole === 'admin' || resourceUserId === socket.userId) {
        next();
      } else {
        next(new Error('Access denied to this resource'));
      }
    } catch (error) {
      next(new Error('Resource authorization failed'));
    }
  };
};