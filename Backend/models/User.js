import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent'],
    required: [true, 'User role is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Student/Parent Specific
  studentId: {
    type: String,
    sparse: true,
    unique: true
  },
  grade: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Teacher Specific
  teacherId: {
    type: String,
    sparse: true,
    unique: true
  },
  qualifications: [String],
  subjects: [String],
  experience: Number,
  salary: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Authentication & Security
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  otpCode: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  
  // Metadata
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes - removed duplicates that were causing warnings
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ parentId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password only if modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  // Generate student/teacher ID if not provided
  if (this.role === 'student' && !this.studentId) {
    this.studentId = `STU${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  if (this.role === 'teacher' && !this.teacherId) {
    this.teacherId = `TCH${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  this.otpAttempts = 0;
  return otp;
};

userSchema.methods.verifyOTP = function(otp) {
  if (this.otpAttempts >= 5) {
    throw new Error('Too many OTP attempts. Please request a new OTP.');
  }
  
  this.otpAttempts += 1;
  
  if (this.otpExpires < Date.now()) {
    throw new Error('OTP has expired');
  }
  
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  return hashedOTP === this.otpCode;
};

userSchema.methods.incrementLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static methods
userSchema.statics.findActiveUsers = function(role) {
  return this.find({ 
    status: 'active',
    ...(role && { role })
  });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

userSchema.statics.findByVerificationToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

const User = mongoose.model('User', userSchema);
export default User;