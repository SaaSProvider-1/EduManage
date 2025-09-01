import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  
  // Student Attendance Records
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    },
    arrivalTime: Date,
    departureTime: Date,
    lateMinutes: {
      type: Number,
      default: 0
    },
    remarks: String
  }],
  
  // Teacher Attendance
  teacherAttendance: {
    arrivalTime: Date,
    departureTime: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },
    lateMinutes: {
      type: Number,
      default: 0
    },
    remarks: String
  },
  
  // Class Information
  classDetails: {
    startTime: String,
    endTime: String,
    actualStartTime: Date,
    actualEndTime: Date,
    topic: String,
    homework: String,
    classConducted: {
      type: Boolean,
      default: true
    },
    cancelReason: String
  },
  
  // Statistics
  totalStudents: {
    type: Number,
    default: 0
  },
  presentStudents: {
    type: Number,
    default: 0
  },
  absentStudents: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  
  // Metadata
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: Date,
  
  // Additional Information
  weather: String,
  specialNotes: String,
  attachments: [{
    type: String // URLs to uploaded files
  }]
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ teacher: 1, date: 1 });
attendanceSchema.index({ 'students.student': 1 });
attendanceSchema.index({ date: -1 });

// Pre-save middleware
attendanceSchema.pre('save', function(next) {
  // Calculate statistics
  this.totalStudents = this.students.length;
  this.presentStudents = this.students.filter(s => s.status === 'present').length;
  this.absentStudents = this.students.filter(s => s.status === 'absent').length;
  
  if (this.totalStudents > 0) {
    this.attendancePercentage = Math.round((this.presentStudents / this.totalStudents) * 100);
  }
  
  // Set last updated timestamp
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  
  next();
});

// Instance methods
attendanceSchema.methods.markStudentAttendance = function(studentId, status, arrivalTime = null, remarks = '') {
  const studentIndex = this.students.findIndex(s => s.student.toString() === studentId.toString());
  
  if (studentIndex === -1) {
    // Add new student attendance record
    this.students.push({
      student: studentId,
      status,
      arrivalTime: arrivalTime || new Date(),
      remarks
    });
  } else {
    // Update existing record
    this.students[studentIndex].status = status;
    this.students[studentIndex].arrivalTime = arrivalTime || this.students[studentIndex].arrivalTime;
    this.students[studentIndex].remarks = remarks;
  }
  
  // Calculate late minutes if status is 'late'
  if (status === 'late' && arrivalTime && this.classDetails.startTime) {
    const [startHour, startMinute] = this.classDetails.startTime.split(':');
    const classStart = new Date();
    classStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const lateMinutes = Math.max(0, (arrivalTime.getTime() - classStart.getTime()) / (1000 * 60));
    this.students[studentIndex > -1 ? studentIndex : this.students.length - 1].lateMinutes = Math.round(lateMinutes);
  }
  
  return this.save();
};

attendanceSchema.methods.markTeacherAttendance = function(arrivalTime, status = 'present', remarks = '') {
  this.teacherAttendance.arrivalTime = arrivalTime;
  this.teacherAttendance.status = status;
  this.teacherAttendance.remarks = remarks;
  
  // Calculate late minutes if teacher is late
  if (status === 'late' && this.classDetails.startTime) {
    const [startHour, startMinute] = this.classDetails.startTime.split(':');
    const classStart = new Date();
    classStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const lateMinutes = Math.max(0, (arrivalTime.getTime() - classStart.getTime()) / (1000 * 60));
    this.teacherAttendance.lateMinutes = Math.round(lateMinutes);
  }
  
  return this.save();
};

attendanceSchema.methods.getAttendanceSummary = function() {
  return {
    date: this.date,
    totalStudents: this.totalStudents,
    presentStudents: this.presentStudents,
    absentStudents: this.absentStudents,
    attendancePercentage: this.attendancePercentage,
    teacherStatus: this.teacherAttendance.status,
    classConducted: this.classDetails.classConducted
  };
};

// Static methods
attendanceSchema.statics.findByBatch = function(batchId, startDate = null, endDate = null) {
  const query = { batch: batchId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('teacher', 'firstName lastName email')
    .populate('students.student', 'firstName lastName studentId')
    .sort({ date: -1 });
};

attendanceSchema.statics.findByStudent = function(studentId, startDate = null, endDate = null) {
  const query = { 'students.student': studentId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('batch', 'name code subject grade')
    .populate('teacher', 'firstName lastName')
    .sort({ date: -1 });
};

attendanceSchema.statics.getStudentAttendanceStats = function(studentId, batchId = null) {
  const matchStage = { 'students.student': mongoose.Types.ObjectId(studentId) };
  if (batchId) matchStage.batch = mongoose.Types.ObjectId(batchId);
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$students' },
    { $match: { 'students.student': mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$students.student',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$students.status', 'present'] }, 1, 0] }
        },
        absentClasses: {
          $sum: { $cond: [{ $eq: ['$students.status', 'absent'] }, 1, 0] }
        },
        lateClasses: {
          $sum: { $cond: [{ $eq: ['$students.status', 'late'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        attendancePercentage: {
          $multiply: [
            { $divide: ['$presentClasses', '$totalClasses'] },
            100
          ]
        }
      }
    }
  ]);
};

attendanceSchema.statics.getBatchAttendanceStats = function(batchId, month = null, year = null) {
  const matchStage = { batch: mongoose.Types.ObjectId(batchId) };
  
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    matchStage.date = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$batch',
        totalClasses: { $sum: 1 },
        averageAttendance: { $avg: '$attendancePercentage' },
        totalStudentDays: { $sum: '$totalStudents' },
        totalPresentDays: { $sum: '$presentStudents' }
      }
    },
    {
      $addFields: {
        overallAttendancePercentage: {
          $multiply: [
            { $divide: ['$totalPresentDays', '$totalStudentDays'] },
            100
          ]
        }
      }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;