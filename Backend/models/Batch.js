import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true,
    maxLength: [100, 'Batch name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Academic Information
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'Grade/Class is required']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Teacher Assignment
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher assignment is required']
  },
  assistantTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Students
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed', 'dropped'],
      default: 'active'
    }
  }],
  
  // Schedule
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    room: String
  }],
  
  // Capacity and Pricing
  maxStudents: {
    type: Number,
    required: [true, 'Maximum student capacity is required'],
    min: [1, 'Maximum students must be at least 1']
  },
  feeStructure: {
    monthlyFee: {
      type: Number,
      required: [true, 'Monthly fee is required'],
      min: [0, 'Fee cannot be negative']
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: [0, 'Fee cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Duration and Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: {
    type: Number, // in months
    required: [true, 'Duration is required']
  },
  
  // Status and Settings
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowOnlineJoining: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  totalClasses: {
    type: Number,
    default: 0
  },
  completedClasses: {
    type: Number,
    default: 0
  },
  averageAttendance: {
    type: Number,
    default: 0
  },
  
  // Additional Settings
  settings: {
    allowLateJoining: {
      type: Boolean,
      default: false
    },
    maxAbsences: {
      type: Number,
      default: 5
    },
    notifyParents: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes - removed duplicate code index since it's already unique in schema
batchSchema.index({ teacher: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ subject: 1, grade: 1 });
batchSchema.index({ startDate: 1, endDate: 1 });

// Virtuals
batchSchema.virtual('currentStudents').get(function() {
  return this.students.filter(s => s.status === 'active').length;
});

batchSchema.virtual('availableSeats').get(function() {
  return this.maxStudents - this.currentStudents;
});

batchSchema.virtual('isFullyBooked').get(function() {
  return this.currentStudents >= this.maxStudents;
});

batchSchema.virtual('progressPercentage').get(function() {
  if (this.totalClasses === 0) return 0;
  return Math.round((this.completedClasses / this.totalClasses) * 100);
});

// Pre-save middleware
batchSchema.pre('save', function(next) {
  // Generate batch code if not provided
  if (!this.code) {
    const subjectCode = this.subject.substring(0, 3).toUpperCase();
    const gradeCode = this.grade.replace(/\s+/g, '');
    const timestamp = Date.now().toString().slice(-4);
    this.code = `${subjectCode}${gradeCode}${timestamp}`;
  }
  
  // Validate end date is after start date
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  // Calculate duration in months if not provided
  if (!this.duration) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }
  
  next();
});

// Instance methods
batchSchema.methods.addStudent = function(studentId) {
  if (this.isFullyBooked) {
    throw new Error('Batch is fully booked');
  }
  
  const existingStudent = this.students.find(s => s.student.toString() === studentId.toString());
  if (existingStudent) {
    if (existingStudent.status === 'active') {
      throw new Error('Student is already enrolled in this batch');
    } else {
      existingStudent.status = 'active';
      existingStudent.enrollmentDate = new Date();
    }
  } else {
    this.students.push({
      student: studentId,
      enrollmentDate: new Date(),
      status: 'active'
    });
  }
  
  return this.save();
};

batchSchema.methods.removeStudent = function(studentId) {
  const studentIndex = this.students.findIndex(s => s.student.toString() === studentId.toString());
  if (studentIndex === -1) {
    throw new Error('Student not found in this batch');
  }
  
  this.students[studentIndex].status = 'dropped';
  return this.save();
};

batchSchema.methods.updateAttendance = function(attendancePercentage) {
  this.averageAttendance = attendancePercentage;
  return this.save();
};

batchSchema.methods.getTodaysSchedule = function() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return this.schedule.filter(s => s.day === today);
};

// Static methods
batchSchema.statics.findByTeacher = function(teacherId) {
  return this.find({ 
    $or: [
      { teacher: teacherId },
      { assistantTeachers: teacherId }
    ]
  }).populate('teacher assistantTeachers', 'firstName lastName email');
};

batchSchema.statics.findByStudent = function(studentId) {
  return this.find({ 
    'students.student': studentId,
    'students.status': 'active'
  }).populate('teacher', 'firstName lastName email');
};

batchSchema.statics.findActiveBatches = function() {
  return this.find({ 
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });
};

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;