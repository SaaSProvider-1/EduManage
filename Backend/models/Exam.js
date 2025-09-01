import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Exam Configuration
  type: {
    type: String,
    enum: ['quiz', 'assignment', 'midterm', 'final', 'practice', 'mock', 'assessment'],
    required: [true, 'Exam type is required']
  },
  
  // Associated Entities
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  
  // Questions
  questions: [{
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching'],
      required: true
    },
    options: [{
      text: String,
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    correctAnswer: String,
    marks: {
      type: Number,
      required: true,
      min: [0, 'Marks cannot be negative']
    },
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [String],
    attachments: [String]
  }],
  
  // Scheduling
  scheduleDate: {
    type: Date,
    required: [true, 'Schedule date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes']
  },
  
  // Exam Settings
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  
  // Access Control
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    default: 0 // percentage deduction
  },
  
  // Display Settings
  showResultsImmediately: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  
  // Attempt Settings
  maxAttempts: {
    type: Number,
    default: 1,
    min: [1, 'Max attempts must be at least 1']
  },
  timeLimit: {
    type: Number, // in minutes
    min: [1, 'Time limit must be at least 1 minute']
  },
  
  // Results and Statistics
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: [{
      questionId: String,
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      marksObtained: Number,
      timeSpent: Number // in seconds
    }],
    startTime: Date,
    endTime: Date,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    totalMarksObtained: Number,
    percentage: Number,
    grade: String,
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'late_submitted'],
      default: 'submitted'
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    isLateSubmission: {
      type: Boolean,
      default: false
    },
    timeExtended: Number, // extra time given in minutes
    remarks: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // Analytics
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    lowestScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    },
    questionAnalytics: [{
      questionId: String,
      correctAnswers: Number,
      incorrectAnswers: Number,
      skippedAnswers: Number,
      averageTimeSpent: Number,
      difficultyRating: Number
    }]
  },
  
  // Creation and Updates
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional Settings
  instructions: String,
  resources: [String], // URLs to additional resources
  tags: [String],
  
  // Proctoring Settings
  proctoring: {
    enabled: {
      type: Boolean,
      default: false
    },
    lockdownBrowser: {
      type: Boolean,
      default: false
    },
    webcamRequired: {
      type: Boolean,
      default: false
    },
    screenRecording: {
      type: Boolean,
      default: false
    },
    tabSwitchLimit: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
examSchema.index({ batch: 1 });
examSchema.index({ teacher: 1 });
examSchema.index({ scheduleDate: 1 });
examSchema.index({ status: 1 });
examSchema.index({ 'submissions.student': 1 });
examSchema.index({ createdAt: -1 });

// Virtuals
examSchema.virtual('isActive').get(function() {
  const now = new Date();
  const examStart = new Date(`${this.scheduleDate.toDateString()} ${this.startTime}`);
  const examEnd = new Date(`${this.scheduleDate.toDateString()} ${this.endTime}`);
  return now >= examStart && now <= examEnd && this.status === 'active';
});

examSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const examStart = new Date(`${this.scheduleDate.toDateString()} ${this.startTime}`);
  return now < examStart && this.status === 'published';
});

examSchema.virtual('isCompleted').get(function() {
  const now = new Date();
  const examEnd = new Date(`${this.scheduleDate.toDateString()} ${this.endTime}`);
  return now > examEnd || this.status === 'completed';
});

examSchema.virtual('totalStudents').get(function() {
  return [...new Set(this.submissions.map(s => s.student.toString()))].length;
});

// Pre-save middleware
examSchema.pre('save', function(next) {
  // Generate exam code if not provided
  if (!this.code) {
    const subjectCode = this.subject.substring(0, 3).toUpperCase();
    const typeCode = this.type.substring(0, 3).toUpperCase();
    const dateCode = this.scheduleDate.toISOString().slice(2, 10).replace(/-/g, '');
    this.code = `${subjectCode}${typeCode}${dateCode}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  }
  
  // Calculate total marks from questions
  if (this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  }
  
  // Update analytics
  this.updateAnalytics();
  
  next();
});

// Instance methods
examSchema.methods.updateAnalytics = function() {
  if (this.submissions.length === 0) return;
  
  const scores = this.submissions.map(s => s.totalMarksObtained || 0);
  this.analytics.totalAttempts = this.submissions.length;
  this.analytics.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  this.analytics.highestScore = Math.max(...scores);
  this.analytics.lowestScore = Math.min(...scores);
  this.analytics.passRate = (scores.filter(s => s >= this.passingMarks).length / scores.length) * 100;
  
  // Calculate average time spent
  const timesSpent = this.submissions
    .filter(s => s.endTime && s.startTime)
    .map(s => (s.endTime - s.startTime) / 1000 / 60); // in minutes
  
  if (timesSpent.length > 0) {
    this.analytics.averageTimeSpent = timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length;
  }
};

examSchema.methods.submitAnswer = function(studentId, answers, submissionData = {}) {
  // Calculate score
  let totalMarksObtained = 0;
  const processedAnswers = answers.map((answer, index) => {
    const question = this.questions[index];
    let isCorrect = false;
    let marksObtained = 0;
    
    if (question.questionType === 'multiple_choice') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      isCorrect = answer.answer === correctOption?.text;
      marksObtained = isCorrect ? question.marks : 0;
    } else if (question.questionType === 'true_false') {
      isCorrect = answer.answer === question.correctAnswer;
      marksObtained = isCorrect ? question.marks : 0;
    } else {
      // For subjective questions, manual grading required
      marksObtained = 0;
    }
    
    totalMarksObtained += marksObtained;
    
    return {
      questionId: question._id.toString(),
      answer: answer.answer,
      isCorrect,
      marksObtained,
      timeSpent: answer.timeSpent || 0
    };
  });
  
  const percentage = (totalMarksObtained / this.totalMarks) * 100;
  const grade = this.calculateGrade(percentage);
  
  // Find existing submission or create new
  const existingSubmissionIndex = this.submissions.findIndex(
    s => s.student.toString() === studentId.toString()
  );
  
  const submission = {
    student: studentId,
    answers: processedAnswers,
    startTime: submissionData.startTime,
    endTime: submissionData.endTime || new Date(),
    submittedAt: new Date(),
    totalMarksObtained,
    percentage,
    grade,
    status: submissionData.status || 'submitted',
    attemptNumber: existingSubmissionIndex >= 0 ? this.submissions[existingSubmissionIndex].attemptNumber + 1 : 1,
    isLateSubmission: submissionData.isLateSubmission || false,
    ipAddress: submissionData.ipAddress,
    userAgent: submissionData.userAgent
  };
  
  if (existingSubmissionIndex >= 0) {
    this.submissions[existingSubmissionIndex] = submission;
  } else {
    this.submissions.push(submission);
  }
  
  return this.save();
};

examSchema.methods.calculateGrade = function(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

examSchema.methods.getStudentSubmission = function(studentId) {
  return this.submissions.find(s => s.student.toString() === studentId.toString());
};

examSchema.methods.extendTimeForStudent = function(studentId, extraMinutes) {
  const submission = this.getStudentSubmission(studentId);
  if (submission) {
    submission.timeExtended = (submission.timeExtended || 0) + extraMinutes;
    return this.save();
  }
  throw new Error('Student submission not found');
};

// Static methods
examSchema.statics.findUpcomingExams = function(batchId = null) {
  const query = {
    scheduleDate: { $gte: new Date() },
    status: 'published'
  };
  if (batchId) query.batch = batchId;
  
  return this.find(query)
    .populate('batch', 'name code')
    .populate('teacher', 'firstName lastName')
    .sort({ scheduleDate: 1 });
};

examSchema.statics.findActiveExams = function() {
  const now = new Date();
  return this.find({ status: 'active' })
    .populate('batch', 'name code');
};

examSchema.statics.getExamResults = function(examId) {
  return this.findById(examId)
    .populate('submissions.student', 'firstName lastName studentId')
    .populate('batch', 'name code')
    .populate('teacher', 'firstName lastName');
};

const Exam = mongoose.model('Exam', examSchema);
export default Exam;