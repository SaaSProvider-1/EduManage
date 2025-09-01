import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ObjectId format');
  }
  return true;
};

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// Common validation rules
export const commonValidations = {
  objectId: (field) => param(field).custom(isValidObjectId),
  
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: () => body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  phone: () => body('phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
    
  name: (field) => body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} must contain only letters and spaces`),
    
  role: () => body('role')
    .isIn(['admin', 'teacher', 'student', 'parent'])
    .withMessage('Invalid role specified'),
    
  date: (field) => body(field)
    .isISO8601()
    .withMessage(`${field} must be a valid date`),
    
  positiveNumber: (field) => body(field)
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a positive number`),
    
  requiredString: (field) => body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`),
    
  optionalString: (field) => body(field)
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(`${field} cannot exceed 1000 characters`)
};

// User validation rules
export const userValidationRules = {
  register: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email(),
    commonValidations.phone(),
    commonValidations.password(),
    commonValidations.role(),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('address.city').optional().trim().isLength({ max: 100 }).withMessage('City name too long'),
    body('address.state').optional().trim().isLength({ max: 100 }).withMessage('State name too long'),
    body('address.zipCode').optional().matches(/^\d{5,6}$/).withMessage('Invalid ZIP code')
  ],
  
  login: [
    commonValidations.email(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  
  updateProfile: [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
  ],
  
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    commonValidations.password(),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
  ],
  
  forgotPassword: [
    commonValidations.email()
  ],
  
  resetPassword: [
    body('token').notEmpty().withMessage('Reset token is required'),
    commonValidations.password()
  ],
  
  verifyOTP: [
    commonValidations.email(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits')
  ]
};

// Batch validation rules
export const batchValidationRules = {
  createBatch: [
    commonValidations.requiredString('name'),
    body('code').optional().trim().isLength({ max: 20 }).withMessage('Batch code too long'),
    commonValidations.requiredString('subject'),
    commonValidations.requiredString('grade'),
    body('teacher').custom(isValidObjectId),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 month'),
    body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('maxStudents').optional().isInt({ min: 1, max: 100 }).withMessage('Max students must be between 1 and 100'),
    body('schedule').isArray({ min: 1 }).withMessage('Schedule is required'),
    body('schedule.*.day').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Invalid day'),
    body('schedule.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
    body('schedule.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format')
  ],
  
  updateBatch: [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('teacher').optional().custom(isValidObjectId),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('maxStudents').optional().isInt({ min: 1, max: 100 }).withMessage('Max students must be between 1 and 100'),
    body('status').optional().isIn(['draft', 'active', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  
  addStudents: [
    body('studentIds').isArray({ min: 1 }).withMessage('Student IDs array is required'),
    body('studentIds.*').custom(isValidObjectId)
  ]
};

// Attendance validation rules
export const attendanceValidationRules = {
  mark: [
    body('batch').custom(isValidObjectId),
    body('date').isISO8601().withMessage('Invalid date'),
    body('students').isArray({ min: 1 }).withMessage('Students array is required'),
    body('students.*.student').custom(isValidObjectId),
    body('students.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
    body('classDetails.topic').optional().trim().isLength({ max: 200 }).withMessage('Topic too long'),
    body('classDetails.homework').optional().trim().isLength({ max: 500 }).withMessage('Homework too long')
  ],
  
  update: [
    body('students').optional().isArray().withMessage('Students must be an array'),
    body('students.*.student').optional().custom(isValidObjectId),
    body('students.*.status').optional().isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
    body('classDetails.topic').optional().trim().isLength({ max: 200 }).withMessage('Topic too long'),
    body('classDetails.homework').optional().trim().isLength({ max: 500 }).withMessage('Homework too long')
  ]
};

// Fee validation rules
export const feeValidationRules = {
  create: [
    body('student').custom(isValidObjectId),
    body('batch').custom(isValidObjectId),
    body('feeType').isIn(['monthly', 'quarterly', 'semester', 'annual', 'registration', 'exam', 'material', 'late_fee', 'other']).withMessage('Invalid fee type'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('dueDate').isISO8601().withMessage('Invalid due date'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long')
  ],
  
  payment: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be positive'),
    body('paymentMethod').isIn(['cash', 'card', 'online', 'bank_transfer', 'upi', 'cheque']).withMessage('Invalid payment method'),
    body('transactionId').optional().trim().notEmpty().withMessage('Transaction ID cannot be empty'),
    body('paymentDate').optional().isISO8601().withMessage('Invalid payment date')
  ],
  
  discount: [
    body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive'),
    body('reason').trim().isLength({ min: 3, max: 200 }).withMessage('Discount reason must be between 3-200 characters'),
    body('validUntil').optional().isISO8601().withMessage('Invalid valid until date')
  ]
};

// Exam validation rules
export const examValidationRules = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('batch').custom(isValidObjectId),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('scheduleDate').isISO8601().withMessage('Invalid schedule date'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
    body('totalMarks').isFloat({ min: 1 }).withMessage('Total marks must be positive'),
    body('passingMarks').isFloat({ min: 0 }).withMessage('Passing marks must be non-negative'),
    body('type').isIn(['quiz', 'test', 'midterm', 'final', 'assignment', 'project', 'practical', 'oral', 'other']).withMessage('Invalid exam type'),
    body('maxAttempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be at least 1'),
    body('questions').optional().isArray().withMessage('Questions must be an array'),
    body('questions.*.questionText').notEmpty().withMessage('Question text is required'),
    body('questions.*.questionType').isIn(['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching']).withMessage('Invalid question type'),
    body('questions.*.marks').isFloat({ min: 0 }).withMessage('Question marks must be non-negative')
  ],
  
  update: [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty'),
    body('scheduleDate').optional().isISO8601().withMessage('Invalid schedule date'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
    body('totalMarks').optional().isFloat({ min: 1 }).withMessage('Total marks must be positive'),
    body('passingMarks').optional().isFloat({ min: 0 }).withMessage('Passing marks must be non-negative'),
    body('type').optional().isIn(['quiz', 'test', 'midterm', 'final', 'assignment', 'project', 'practical', 'oral', 'other']).withMessage('Invalid exam type'),
    body('maxAttempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be at least 1'),
    body('questions').optional().isArray().withMessage('Questions must be an array'),
    body('questions.*.questionText').optional().notEmpty().withMessage('Question text is required'),
    body('questions.*.questionType').optional().isIn(['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching']).withMessage('Invalid question type'),
    body('questions.*.marks').optional().isFloat({ min: 0 }).withMessage('Question marks must be non-negative')
  ],
  
  submit: [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('answers.*.questionId').notEmpty().withMessage('Question ID is required'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative')
  ]
};

// Notification validation rules
export const notificationValidationRules = {
  create: [
    commonValidations.requiredString('title'),
    commonValidations.requiredString('message'),
    body('type').isIn([
      'attendance', 'fee_reminder', 'fee_payment', 'exam_scheduled', 'exam_result',
      'announcement', 'teacher_absent', 'class_cancelled', 'schedule_change',
      'assignment', 'deadline_reminder', 'birthday', 'holiday', 'maintenance',
      'security_alert', 'system_update', 'parent_meeting', 'performance_report',
      'achievement', 'warning', 'suspension', 'enrollment', 'batch_completion',
      'certificate', 'feedback_request', 'event', 'other'
    ]).withMessage('Invalid notification type'),
    body('category').isIn(['academic', 'financial', 'administrative', 'emergency', 'promotional', 'social']).withMessage('Invalid category'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('targetAudience.roles').optional().isArray().withMessage('Roles must be an array'),
    body('targetAudience.batches').optional().isArray().withMessage('Batches must be an array'),
    body('channels.email').optional().isBoolean().withMessage('Email channel must be boolean'),
    body('channels.sms').optional().isBoolean().withMessage('SMS channel must be boolean'),
    body('scheduleDate').optional().isISO8601().withMessage('Invalid schedule date')
  ]
};

// Query parameter validation
export const queryValidation = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isString(),
    query('fields').optional().isString()
  ],
  
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
    query('year').optional().isInt({ min: 2020, max: 2099 }).withMessage('Invalid year')
  ],
  
  search: [
    query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),
    query('status').optional().isString(),
    query('role').optional().isIn(['admin', 'teacher', 'student', 'parent']).withMessage('Invalid role parameter')
  ]
};