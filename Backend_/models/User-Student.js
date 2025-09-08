const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userStudentSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date of joining cannot be in the future'
    }
  },
  photo: {
    type: String,
    required: [true, 'Student photo is required'],
    trim: true
  },

  // Academic Information
  class: {
    type: String,
    required: [true, 'Class is required'],
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    trim: true
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    minlength: [2, 'School name must be at least 2 characters long'],
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  lastSchoolAttended: {
    type: String,
    required: [true, 'Last school attended is required'],
    trim: true,
    minlength: [2, 'Last school attended must be at least 2 characters long'],
    maxlength: [200, 'Last school attended cannot exceed 200 characters']
  },

  // Family Information
  fatherName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true,
    minlength: [2, "Father's name must be at least 2 characters long"],
    maxlength: [100, "Father's name cannot exceed 100 characters"]
  },
  motherName: {
    type: String,
    required: [true, "Mother's name is required"],
    trim: true,
    minlength: [2, "Mother's name must be at least 2 characters long"],
    maxlength: [100, "Mother's name cannot exceed 100 characters"]
  },
  guardianPhone: {
    type: String,
    required: [true, 'Guardian phone number is required'],
    trim: true,
    match: [
      /^[6-9]\d{9}$/,
      'Please enter a valid 10-digit Indian phone number'
    ]
  },

  // Document Information
  aadharNumber: {
    type: String,
    required: [true, 'Aadhar number is required'],
    unique: true,
    trim: true,
    match: [
      /^\d{12}$/,
      'Aadhar number must be exactly 12 digits'
    ]
  },
  aadharDocument: {
    type: String,
    required: [true, 'Aadhar document is required'],
    trim: true
  },
  completeAddress: {
    type: String,
    required: [true, 'Complete address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },

  // Password Information
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password) {
        // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
        return passwordRegex.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },

  // Additional fields for student management
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    default: 'student',
    immutable: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for student's full display name
userStudentSchema.virtual('displayName').get(function() {
  return `${this.name} (Class ${this.class})`;
});

// Pre-save middleware to hash password
userStudentSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate student ID
userStudentSchema.pre('save', async function(next) {
  if (!this.studentId && this.isNew) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await this.constructor.countDocuments();
      this.studentId = `STU${currentYear}${String(count + 1).padStart(4, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Instance method to check password
userStudentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last login
userStudentSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLogin: Date.now() }
  });
};

// Static method to find by email
userStudentSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by student ID
userStudentSchema.statics.findByStudentId = function(studentId) {
  return this.findOne({ studentId });
};

// Index for better query performance
userStudentSchema.index({ email: 1 });
userStudentSchema.index({ studentId: 1 });
userStudentSchema.index({ aadharNumber: 1 });
userStudentSchema.index({ class: 1 });

const UserStudent = mongoose.model('UserStudent', userStudentSchema);

module.exports = UserStudent;
