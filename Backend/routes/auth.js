import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticateToken, authenticateRefreshToken } from '../middleware/auth.js';
import { userValidationRules, handleValidationErrors } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../utils/email.js';
import { generateOTP } from '../utils/otp.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000000000000, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300000000000000000000, // limit each IP to 3 OTP requests per 5 minutes
  message: 'Too many OTP requests, please try again later.',
});

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper function to check if OTP is required for user
const requiresOTP = (user) => {
  // Require OTP for admin users or if user has enabled 2FA
  return user.role === 'admin' || user.preferences?.twoFactorAuth === true;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  authLimiter,
  userValidationRules.register,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { firstName, lastName, email, phone, password, role, ...otherData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      ...otherData
    });

    await user.save();

    // Generate email verification token
    const emailVerificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email Address',
        template: 'emailVerification',
        data: {
          name: user.fullName,
          verificationUrl: `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`,
          expiresIn: '24 hours'
        }
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('userRegistered', {
        userId: user._id,
        name: user.fullName,
        role: user.role,
        timestamp: new Date()
      });
    }

    // Remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.passwordResetToken;

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  authLimiter,
  userValidationRules.login,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new AppError('Account temporarily locked due to multiple failed login attempts', 423);
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401);
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Check if OTP is required
    if (requiresOTP(user)) {
      // Generate and send OTP
      const otp = user.generateOTP();
      await user.save({ validateBeforeSave: false });

      try {
        await sendEmail({
          to: user.email,
          subject: 'Your Login OTP',
          template: 'loginOTP',
          data: {
            name: user.fullName,
            otp: otp,
            expiresIn: '5 minutes'
          }
        });

        // Emit socket event for OTP sent
        const io = req.app.get('io');
        if (io) {
          io.emit('otpSent', {
            userId: user._id,
            email: user.email,
            timestamp: new Date()
          });
        }

        return res.status(200).json({
          success: true,
          message: 'OTP sent to your email address',
          requiresOTP: true,
          data: {
            email: user.email,
            maskedEmail: user.email.replace(/(.{3}).*(@.*)/, '$1***$2')
          }
        });
      } catch (error) {
        console.error('Failed to send OTP email:', error);
        throw new AppError('Failed to send OTP. Please try again.', 500);
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Emit socket event for successful login
    const io = req.app.get('io');
    if (io) {
      io.emit('userLoggedIn', {
        userId: user._id,
        name: user.fullName,
        role: user.role,
        timestamp: new Date()
      });
    }

    // Remove sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.passwordResetToken;
    delete userResponse.otpCode;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  })
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete login
// @access  Public
router.post('/verify-otp',
  otpLimiter,
  userValidationRules.verifyOTP,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    try {
      // Verify OTP
      const isValidOTP = user.verifyOTP(otp);
      if (!isValidOTP) {
        throw new AppError('Invalid OTP', 400);
      }

      // Clear OTP data
      user.otpCode = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = undefined;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Emit socket event for OTP verification
      const io = req.app.get('io');
      if (io) {
        io.emit('otpVerified', {
          userId: user._id,
          timestamp: new Date()
        });
      }

      // Remove sensitive data
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.emailVerificationToken;
      delete userResponse.passwordResetToken;

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      if (error.message === 'Too many OTP attempts. Please request a new OTP.') {
        throw new AppError(error.message, 429);
      }
      if (error.message === 'OTP has expired') {
        throw new AppError(error.message, 410);
      }
      throw new AppError('Invalid OTP', 400);
    }
  })
);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp',
  otpLimiter,
  catchAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your New Login OTP',
        template: 'loginOTP',
        data: {
          name: user.fullName,
          otp: otp,
          expiresIn: '5 minutes'
        }
      });

      res.status(200).json({
        success: true,
        message: 'New OTP sent to your email address'
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new AppError('Failed to send OTP. Please try again.', 500);
    }
  })
);

// @route   POST /api/auth/send-email-verification
// @desc    Send email verification
// @access  Private
router.post('/send-email-verification',
  authenticateToken,
  catchAsync(async (req, res) => {
    const user = req.user;

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Generate verification token
    const emailVerificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email Address',
        template: 'emailVerification',
        data: {
          name: user.fullName,
          verificationUrl: `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`,
          expiresIn: '24 hours'
        }
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new AppError('Failed to send verification email. Please try again.', 500);
    }
  })
);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email',
  catchAsync(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    const user = await User.findByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Emit socket event for email verification
    const io = req.app.get('io');
    if (io) {
      io.emit('emailVerified', {
        userId: user._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  })
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password',
  authLimiter,
  userValidationRules.forgotPassword,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'passwordReset',
        data: {
          name: user.fullName,
          resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`,
          expiresIn: '1 hour'
        }
      });

      // Emit socket event for password reset request
      const io = req.app.get('io');
      if (io) {
        io.emit('passwordResetRequested', {
          userId: user._id,
          timestamp: new Date()
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    } catch (error) {
      // Reset the token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email. Please try again.', 500);
    }
  })
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password',
  authLimiter,
  userValidationRules.resetPassword,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Reset login attempts
    user.loginAttempts = undefined;
    user.lockUntil = undefined;
    
    await user.save();

    // Emit socket event for password reset
    const io = req.app.get('io');
    if (io) {
      io.emit('passwordReset', {
        userId: user._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated user)
// @access  Private
router.post('/change-password',
  authenticateToken,
  userValidationRules.changePassword,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { currentPassword, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Set new password
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token',
  authenticateRefreshToken,
  catchAsync(async (req, res) => {
    const { accessToken, refreshToken } = generateTokens(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  })
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me',
  authenticateToken,
  catchAsync(async (req, res) => {
    const user = req.user.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
    delete user.otpCode;

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate tokens - if using blacklist)
// @access  Private
router.post('/logout',
  authenticateToken,
  catchAsync(async (req, res) => {
    // In a production app, you might want to blacklist the token
    // or store logout time in database
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

// @route   POST /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.post('/verify-token',
  authenticateToken,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          _id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          isEmailVerified: req.user.isEmailVerified
        }
      }
    });
  }
);

export default router;