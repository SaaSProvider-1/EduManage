import express from 'express';
import Exam from '../models/Exam.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken, authorizeRoles, checkPermission } from '../middleware/auth.js';
import { examValidationRules, handleValidationErrors, queryValidation } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../utils/email.js';
import cron from 'node-cron';

const router = express.Router();

// Helper function for pagination
const getPaginationOptions = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

// Helper function for date range queries
const buildDateQuery = (req) => {
  const dateQuery = {};
  
  if (req.query.startDate) {
    dateQuery.$gte = new Date(req.query.startDate);
  }
  
  if (req.query.endDate) {
    dateQuery.$lte = new Date(req.query.endDate);
  }
  
  if (req.query.month && req.query.year) {
    const month = parseInt(req.query.month) - 1;
    const year = parseInt(req.query.year);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    dateQuery.$gte = startDate;
    dateQuery.$lte = endDate;
  }
  
  return Object.keys(dateQuery).length > 0 ? dateQuery : null;
};

// Helper function to build exam search query
const buildExamSearchQuery = (req) => {
  const query = {};
  
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { title: searchRegex },
      { code: searchRegex },
      { subject: searchRegex },
      { type: searchRegex },
      { 'batch.name': searchRegex },
      { 'teacher.firstName': searchRegex },
      { 'teacher.lastName': searchRegex }
    ];
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  if (req.query.batch) {
    query.batch = req.query.batch;
  }
  
  if (req.query.teacher) {
    query.teacher = req.query.teacher;
  }
  
  if (req.query.subject) {
    query.subject = new RegExp(req.query.subject, 'i');
  }
  
  // Add date range if specified
  const dateQuery = buildDateQuery(req);
  if (dateQuery) {
    query.scheduleDate = dateQuery;
  }
  
  return query;
};

// @route   GET /api/exams
// @desc    Get all exams with filtering and pagination
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    let query = buildExamSearchQuery(req);
    
    // Role-based filtering
    if (req.user.role === 'student') {
      // Get batches student is enrolled in
      const studentBatches = await Batch.find({
        'students.student': req.user._id,
        'students.status': 'active'
      }).select('_id');
      
      const batchIds = studentBatches.map(batch => batch._id);
      query.batch = { $in: batchIds };
      query.status = { $in: ['published', 'active', 'completed'] };
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      if (parent.children.length > 0) {
        const childrenIds = parent.children.map(child => child._id);
        const parentBatches = await Batch.find({
          'students.student': { $in: childrenIds },
          'students.status': 'active'
        }).select('_id');
        
        const batchIds = parentBatches.map(batch => batch._id);
        query.batch = { $in: batchIds };
        query.status = { $in: ['published', 'active', 'completed'] };
      } else {
        return res.status(200).json({
          success: true,
          data: {
            exams: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalExams: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can view exams for their batches
      const teacherBatches = await Batch.find({
        $or: [
          { teacher: req.user._id },
          { assistantTeachers: req.user._id }
        ]
      }).select('_id');
      
      const batchIds = teacherBatches.map(batch => batch._id);
      query.batch = { $in: batchIds };
    }
    
    // Build sort object
    const sortOptions = {};
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      sortFields.forEach(field => {
        const sortOrder = field.startsWith('-') ? -1 : 1;
        const sortField = field.replace('-', '');
        sortOptions[sortField] = sortOrder;
      });
    } else {
      sortOptions.scheduleDate = -1; // Default sort by schedule date
    }
    
    // Execute queries in parallel
    const [exams, totalExams] = await Promise.all([
      Exam.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('batch', 'name code subject grade')
        .populate('teacher', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .select('-questions.correctAnswer -questions.explanation')
        .lean(),
      Exam.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalExams / limit);
    
    res.status(200).json({
      success: true,
      data: {
        exams,
        pagination: {
          currentPage: page,
          totalPages,
          totalExams,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/exams/upcoming
// @desc    Get upcoming exams
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/upcoming',
  authenticateToken,
  queryValidation.pagination,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    let batchIds = [];
    
    // Role-based filtering for batches
    if (req.user.role === 'student') {
      const studentBatches = await Batch.find({
        'students.student': req.user._id,
        'students.status': 'active'
      }).select('_id');
      batchIds = studentBatches.map(batch => batch._id);
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      if (parent.children.length > 0) {
        const childrenIds = parent.children.map(child => child._id);
        const parentBatches = await Batch.find({
          'students.student': { $in: childrenIds },
          'students.status': 'active'
        }).select('_id');
        batchIds = parentBatches.map(batch => batch._id);
      }
    } else if (req.user.role === 'teacher') {
      const teacherBatches = await Batch.find({
        $or: [
          { teacher: req.user._id },
          { assistantTeachers: req.user._id }
        ]
      }).select('_id');
      batchIds = teacherBatches.map(batch => batch._id);
    }
    
    const query = {
      scheduleDate: { $gte: new Date() },
      status: 'published'
    };
    
    if (req.user.role !== 'admin') {
      query.batch = { $in: batchIds };
    }
    
    const [upcomingExams, totalUpcoming] = await Promise.all([
      Exam.find(query)
        .sort({ scheduleDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('batch', 'name code subject grade')
        .populate('teacher', 'firstName lastName')
        .select('-questions.correctAnswer -questions.explanation')
        .lean(),
      Exam.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalUpcoming / limit);
    
    res.status(200).json({
      success: true,
      data: {
        upcomingExams,
        pagination: {
          currentPage: page,
          totalPages,
          totalUpcoming,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/exams/active
// @desc    Get currently active exams
// @access  Private (Admin, Teacher, Student)
router.get('/active',
  authenticateToken,
  catchAsync(async (req, res) => {
    let batchIds = [];
    
    // Role-based filtering for batches
    if (req.user.role === 'student') {
      const studentBatches = await Batch.find({
        'students.student': req.user._id,
        'students.status': 'active'
      }).select('_id');
      batchIds = studentBatches.map(batch => batch._id);
    } else if (req.user.role === 'teacher') {
      const teacherBatches = await Batch.find({
        $or: [
          { teacher: req.user._id },
          { assistantTeachers: req.user._id }
        ]
      }).select('_id');
      batchIds = teacherBatches.map(batch => batch._id);
    }
    
    const query = { status: 'active' };
    
    if (req.user.role !== 'admin') {
      query.batch = { $in: batchIds };
    }
    
    const activeExams = await Exam.find(query)
      .populate('batch', 'name code')
      .populate('teacher', 'firstName lastName')
      .select('-questions.correctAnswer -questions.explanation')
      .lean();
    
    res.status(200).json({
      success: true,
      data: { activeExams }
    });
  })
);

// @route   GET /api/exams/stats
// @desc    Get exam statistics
// @access  Private (Admin only)
router.get('/stats',
  authenticateToken,
  authorizeRoles('admin'),
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const dateQuery = buildDateQuery(req);
    let matchStage = {};
    
    if (dateQuery) {
      matchStage.scheduleDate = dateQuery;
    }
    
    // Get overall statistics
    const overallStats = await Exam.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgTotalMarks: { $avg: '$totalMarks' },
          avgPassingMarks: { $avg: '$passingMarks' },
          totalSubmissions: { $sum: '$analytics.totalAttempts' },
          avgScore: { $avg: '$analytics.averageScore' },
          avgPassRate: { $avg: '$analytics.passRate' }
        }
      }
    ]);
    
    // Get status-wise statistics
    const statusStats = await Exam.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgSubmissions: { $avg: '$analytics.totalAttempts' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get exam type statistics
    const typeStats = await Exam.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgScore: { $avg: '$analytics.averageScore' },
          avgPassRate: { $avg: '$analytics.passRate' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get subject-wise statistics
    const subjectStats = await Exam.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          avgScore: { $avg: '$analytics.averageScore' },
          avgPassRate: { $avg: '$analytics.passRate' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get teacher performance
    const teacherStats = await Exam.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$teacher',
          examCount: { $sum: 1 },
          avgScore: { $avg: '$analytics.averageScore' },
          avgPassRate: { $avg: '$analytics.passRate' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
        }
      },
      { $unwind: '$teacher' },
      { $sort: { examCount: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalExams: 0,
          avgDuration: 0,
          avgTotalMarks: 0,
          avgPassingMarks: 0,
          totalSubmissions: 0,
          avgScore: 0,
          avgPassRate: 0
        },
        statusStats,
        typeStats,
        subjectStats,
        teacherStats
      }
    });
  })
);

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const includeAnswers = req.query.includeAnswers === 'true';
    
    let selectFields = '-questions.correctAnswer -questions.explanation';
    
    // Only admin and teacher can see correct answers
    if ((req.user.role === 'admin' || req.user.role === 'teacher') && includeAnswers) {
      selectFields = '';
    }
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name code subject grade students')
      .populate('teacher', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('submissions.student', 'firstName lastName studentId email')
      .select(selectFields);
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check access permissions
    if (req.user.role === 'student') {
      const batch = await Batch.findById(exam.batch._id);
      const isEnrolled = batch.students.some(s => 
        s.student.equals(req.user._id) && s.status === 'active'
      );
      if (!isEnrolled) {
        throw new AppError('Access denied', 403);
      }
      
      // Students can only see their own submission
      if (exam.submissions) {
        exam.submissions = exam.submissions.filter(s => 
          s.student._id.equals(req.user._id)
        );
      }
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const childrenIds = parent.children.map(child => child._id.toString());
      const batch = await Batch.findById(exam.batch._id);
      const hasChild = batch.students.some(s => 
        childrenIds.includes(s.student.toString()) && s.status === 'active'
      );
      if (!hasChild) {
        throw new AppError('Access denied', 403);
      }
      
      // Parents can only see their children's submissions
      if (exam.submissions) {
        exam.submissions = exam.submissions.filter(s => 
          childrenIds.includes(s.student._id.toString())
        );
      }
    } else if (req.user.role === 'teacher') {
      const batch = await Batch.findById(exam.batch._id);
      if (!batch.teacher.equals(req.user._id) && 
          !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
        throw new AppError('Access denied', 403);
      }
    }
    
    res.status(200).json({
      success: true,
      data: { exam }
    });
  })
);

// @route   POST /api/exams
// @desc    Create new exam
// @access  Private (Admin, Teacher)
router.post('/',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  examValidationRules.create,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const examData = req.body;
    
    // Verify batch exists and user has permission
    const batch = await Batch.findById(examData.batch);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check if teacher is authorized for this batch
    if (req.user.role === 'teacher') {
      if (!batch.teacher.equals(req.user._id) && 
          !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
        throw new AppError('Access denied - not assigned to this batch', 403);
      }
      examData.teacher = req.user._id;
    } else {
      // Admin can assign any teacher
      if (examData.teacher) {
        const teacher = await User.findById(examData.teacher);
        if (!teacher || teacher.role !== 'teacher') {
          throw new AppError('Invalid teacher', 400);
        }
      }
    }
    
    // Check for time conflicts
    const conflictingExam = await Exam.findOne({
      batch: examData.batch,
      scheduleDate: examData.scheduleDate,
      $or: [
        {
          $and: [
            { startTime: { $lte: examData.startTime } },
            { endTime: { $gte: examData.startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lte: examData.endTime } },
            { endTime: { $gte: examData.endTime } }
          ]
        },
        {
          $and: [
            { startTime: { $gte: examData.startTime } },
            { endTime: { $lte: examData.endTime } }
          ]
        }
      ],
      status: { $ne: 'cancelled' }
    });
    
    if (conflictingExam) {
      throw new AppError('Time conflict with existing exam', 400);
    }
    
    // Create exam
    const exam = new Exam({
      ...examData,
      createdBy: req.user._id,
      teacher: examData.teacher || req.user._id
    });
    
    await exam.save();
    
    // Populate the created exam
    await exam.populate([
      { path: 'batch', select: 'name code subject grade students' },
      { path: 'teacher', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);
    
    // Send notifications to students if exam is published
    if (exam.status === 'published') {
      try {
        const students = await User.find({
          _id: { $in: exam.batch.students.map(s => s.student) },
          status: 'active'
        }).select('_id firstName lastName email parentId');
        
        // Create notifications for students
        const notifications = [];
        const recipients = [];
        
        for (const student of students) {
          recipients.push({ user: student._id, role: 'student' });
          if (student.parentId) {
            recipients.push({ user: student.parentId, role: 'parent' });
          }
        }
        
        const notification = new Notification({
          title: `New ${exam.type} Scheduled`,
          message: `A new ${exam.type} "${exam.title}" has been scheduled for ${exam.batch.name} on ${exam.scheduleDate.toLocaleDateString()} at ${exam.startTime}`,
          type: 'exam_scheduled',
          category: 'academic',
          priority: 'high',
          sender: req.user._id,
          recipients,
          relatedData: {
            examId: exam._id,
            batchId: exam.batch._id
          }
        });
        
        await notification.save();
        
        // Send email notifications
        for (const student of students) {
          await sendEmail({
            to: student.email,
            subject: `New ${exam.type} Scheduled - CoachingPro`,
            template: 'examScheduled',
            data: {
              studentName: student.firstName + ' ' + student.lastName,
              examTitle: exam.title,
              examType: exam.type,
              batchName: exam.batch.name,
              examDate: exam.scheduleDate.toLocaleDateString(),
              startTime: exam.startTime,
              duration: exam.duration,
              totalMarks: exam.totalMarks,
              instructions: exam.instructions
            }
          });
        }
        
        // Real-time notifications
        const io = req.app.get('io');
        if (io) {
          recipients.forEach(recipient => {
            io.to(recipient.user.toString()).emit('examScheduled', {
              examId: exam._id,
              title: exam.title,
              type: exam.type,
              batchName: exam.batch.name,
              scheduleDate: exam.scheduleDate,
              startTime: exam.startTime,
              timestamp: new Date()
            });
          });
        }
      } catch (error) {
        console.error('Failed to send exam notifications:', error);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam }
    });
  })
);

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private (Admin, Teacher)
router.put('/:id',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  examValidationRules.update,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name students')
      .populate('teacher', 'firstName lastName');
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'teacher') {
      if (!exam.teacher._id.equals(req.user._id)) {
        throw new AppError('Access denied', 403);
      }
    }
    
    // Check if exam can be updated
    if (exam.status === 'active' && exam.submissions.length > 0) {
      throw new AppError('Cannot update exam with active submissions', 400);
    }
    
    if (exam.status === 'completed') {
      throw new AppError('Cannot update completed exam', 400);
    }
    
    // Check for time conflicts if schedule is being updated
    if (updateData.scheduleDate || updateData.startTime || updateData.endTime) {
      const scheduleDate = updateData.scheduleDate || exam.scheduleDate;
      const startTime = updateData.startTime || exam.startTime;
      const endTime = updateData.endTime || exam.endTime;
      
      const conflictingExam = await Exam.findOne({
        _id: { $ne: id },
        batch: exam.batch._id,
        scheduleDate,
        $or: [
          {
            $and: [
              { startTime: { $lte: startTime } },
              { endTime: { $gte: startTime } }
            ]
          },
          {
            $and: [
              { startTime: { $lte: endTime } },
              { endTime: { $gte: endTime } }
            ]
          },
          {
            $and: [
              { startTime: { $gte: startTime } },
              { endTime: { $lte: endTime } }
            ]
          }
        ],
        status: { $ne: 'cancelled' }
      });
      
      if (conflictingExam) {
        throw new AppError('Time conflict with existing exam', 400);
      }
    }
    
    // Update exam
    Object.assign(exam, updateData);
    exam.lastUpdatedBy = req.user._id;
    
    await exam.save();
    
    // Send update notifications if exam is published
    if (exam.status === 'published' && exam.submissions.length === 0) {
      try {
        const students = await User.find({
          _id: { $in: exam.batch.students.map(s => s.student) },
          status: 'active'
        }).select('_id firstName lastName email parentId');
        
        const recipients = [];
        for (const student of students) {
          recipients.push({ user: student._id, role: 'student' });
          if (student.parentId) {
            recipients.push({ user: student.parentId, role: 'parent' });
          }
        }
        
        const notification = new Notification({
          title: 'Exam Updated',
          message: `The ${exam.type} "${exam.title}" for ${exam.batch.name} has been updated. Please check the latest details.`,
          type: 'exam_updated',
          category: 'academic',
          priority: 'medium',
          sender: req.user._id,
          recipients,
          relatedData: {
            examId: exam._id,
            batchId: exam.batch._id
          }
        });
        
        await notification.save();
        
        // Real-time notifications
        const io = req.app.get('io');
        if (io) {
          recipients.forEach(recipient => {
            io.to(recipient.user.toString()).emit('examUpdated', {
              examId: exam._id,
              title: exam.title,
              batchName: exam.batch.name,
              timestamp: new Date()
            });
          });
        }
      } catch (error) {
        console.error('Failed to send exam update notifications:', error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam }
    });
  })
);

// @route   POST /api/exams/:id/submit
// @desc    Submit exam answers
// @access  Private (Student only)
router.post('/:id/submit',
  authenticateToken,
  authorizeRoles('student'),
  examValidationRules.submit,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { answers, submissionData } = req.body;
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name students')
      .populate('teacher', 'firstName lastName email');
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check if student is enrolled in the batch
    const isEnrolled = exam.batch.students.some(s => 
      s.student.equals(req.user._id) && s.status === 'active'
    );
    if (!isEnrolled) {
      throw new AppError('Access denied - not enrolled in this batch', 403);
    }
    
    // Check exam status
    if (exam.status !== 'active') {
      throw new AppError('Exam is not currently active', 400);
    }
    
    // Check if exam is currently running
    if (!exam.isActive) {
      throw new AppError('Exam is not currently running', 400);
    }
    
    // Check existing submissions and attempt limits
    const existingSubmission = exam.getStudentSubmission(req.user._id);
    if (existingSubmission && exam.maxAttempts <= existingSubmission.attemptNumber) {
      throw new AppError('Maximum attempts exceeded', 400);
    }
    
    // Submit answers
    await exam.submitAnswer(req.user._id, answers, {
      ...submissionData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const submission = exam.getStudentSubmission(req.user._id);
    
    // Send notifications
    try {
      // Notify teacher
      const notification = new Notification({
        title: 'Exam Submitted',
        message: `${req.user.firstName} ${req.user.lastName} has submitted ${exam.title}. Score: ${submission.percentage.toFixed(2)}%`,
        type: 'exam_submitted',
        category: 'academic',
        priority: 'medium',
        sender: req.user._id,
        recipients: [{ user: exam.teacher._id, role: 'teacher' }]
      });
      
      await notification.save();
      
      // Send email to teacher
      await sendEmail({
        to: exam.teacher.email,
        subject: `Exam Submission - ${exam.title}`,
        template: 'examSubmitted',
        data: {
          teacherName: exam.teacher.firstName + ' ' + exam.teacher.lastName,
          studentName: req.user.firstName + ' ' + req.user.lastName,
          examTitle: exam.title,
          batchName: exam.batch.name,
          score: submission.percentage.toFixed(2),
          grade: submission.grade,
          submissionTime: submission.submittedAt.toLocaleString()
        }
      });
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(exam.teacher._id.toString()).emit('examSubmitted', {
          examId: exam._id,
          studentId: req.user._id,
          studentName: req.user.firstName + ' ' + req.user.lastName,
          score: submission.percentage,
          grade: submission.grade,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send exam submission notifications:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        submissionId: submission._id,
        score: submission.totalMarksObtained,
        percentage: submission.percentage,
        grade: submission.grade,
        showResults: exam.showResultsImmediately
      }
    });
  })
);

// @route   GET /api/exams/:id/results
// @desc    Get exam results
// @access  Private (Admin, Teacher, Student for own result)
router.get('/:id/results',
  authenticateToken,
  queryValidation.pagination,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page, limit, skip } = getPaginationOptions(req);
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name code students')
      .populate('teacher', 'firstName lastName')
      .populate('submissions.student', 'firstName lastName studentId email');
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'student') {
      const isEnrolled = exam.batch.students.some(s => 
        s.student.equals(req.user._id) && s.status === 'active'
      );
      if (!isEnrolled) {
        throw new AppError('Access denied', 403);
      }
      
      // Students can only see their own result
      const studentSubmission = exam.getStudentSubmission(req.user._id);
      
      return res.status(200).json({
        success: true,
        data: {
          exam: {
            _id: exam._id,
            title: exam.title,
            type: exam.type,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            showCorrectAnswers: exam.showCorrectAnswers
          },
          submission: studentSubmission || null,
          questions: exam.showCorrectAnswers ? exam.questions : exam.questions.map(q => ({
            ...q.toObject(),
            correctAnswer: undefined,
            explanation: undefined
          }))
        }
      });
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const childrenIds = parent.children.map(child => child._id.toString());
      const hasChild = exam.batch.students.some(s => 
        childrenIds.includes(s.student.toString()) && s.status === 'active'
      );
      if (!hasChild) {
        throw new AppError('Access denied', 403);
      }
      
      // Parents can only see their children's results
      const childrenSubmissions = exam.submissions.filter(s => 
        childrenIds.includes(s.student._id.toString())
      );
      
      return res.status(200).json({
        success: true,
        data: {
          exam: {
            _id: exam._id,
            title: exam.title,
            type: exam.type,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks
          },
          submissions: childrenSubmissions
        }
      });
    } else if (req.user.role === 'teacher') {
      const batch = await Batch.findById(exam.batch._id);
      if (!batch.teacher.equals(req.user._id) && 
          !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
        throw new AppError('Access denied', 403);
      }
    }
    
    // Admin and authorized teacher can see all results
    const totalSubmissions = exam.submissions.length;
    const paginatedSubmissions = exam.submissions
      .slice(skip, skip + limit);
    
    const totalPages = Math.ceil(totalSubmissions / limit);
    
    // Calculate detailed analytics
    const analytics = {
      ...exam.analytics.toObject(),
      gradeDistribution: {},
      scoreRanges: {
        '90-100': 0,
        '80-89': 0,
        '70-79': 0,
        '60-69': 0,
        '50-59': 0,
        'Below 50': 0
      }
    };
    
    exam.submissions.forEach(submission => {
      // Grade distribution
      const grade = submission.grade || 'F';
      analytics.gradeDistribution[grade] = (analytics.gradeDistribution[grade] || 0) + 1;
      
      // Score ranges
      const percentage = submission.percentage || 0;
      if (percentage >= 90) analytics.scoreRanges['90-100']++;
      else if (percentage >= 80) analytics.scoreRanges['80-89']++;
      else if (percentage >= 70) analytics.scoreRanges['70-79']++;
      else if (percentage >= 60) analytics.scoreRanges['60-69']++;
      else if (percentage >= 50) analytics.scoreRanges['50-59']++;
      else analytics.scoreRanges['Below 50']++;
    });
    
    res.status(200).json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          type: exam.type,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          batch: exam.batch
        },
        results: paginatedSubmissions,
        analytics,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubmissions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   PUT /api/exams/:id/status
// @desc    Update exam status
// @access  Private (Admin, Teacher)
router.put('/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['draft', 'published', 'active', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name students')
      .populate('teacher', 'firstName lastName');
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'teacher') {
      if (!exam.teacher._id.equals(req.user._id)) {
        throw new AppError('Access denied', 403);
      }
    }
    
    const oldStatus = exam.status;
    exam.status = status;
    exam.lastUpdatedBy = req.user._id;
    
    if (status === 'cancelled' && reason) {
      exam.instructions = (exam.instructions || '') + `\n\nCancelled: ${reason}`;
    }
    
    await exam.save();
    
    // Send notifications for status changes
    if (oldStatus !== status && ['published', 'active', 'completed', 'cancelled'].includes(status)) {
      try {
        const students = await User.find({
          _id: { $in: exam.batch.students.map(s => s.student) },
          status: 'active'
        }).select('_id firstName lastName email parentId');
        
        const recipients = [];
        for (const student of students) {
          recipients.push({ user: student._id, role: 'student' });
          if (student.parentId) {
            recipients.push({ user: student.parentId, role: 'parent' });
          }
        }
        
        let message = '';
        let priority = 'medium';
        
        switch (status) {
          case 'published':
            message = `The ${exam.type} "${exam.title}" for ${exam.batch.name} is now available`;
            priority = 'high';
            break;
          case 'active':
            message = `The ${exam.type} "${exam.title}" is now active and ready for submission`;
            priority = 'high';
            break;
          case 'completed':
            message = `The ${exam.type} "${exam.title}" has been completed`;
            break;
          case 'cancelled':
            message = `The ${exam.type} "${exam.title}" has been cancelled. ${reason ? `Reason: ${reason}` : ''}`;
            priority = 'high';
            break;
        }
        
        const notification = new Notification({
          title: 'Exam Status Updated',
          message,
          type: 'exam_status_updated',
          category: 'academic',
          priority,
          sender: req.user._id,
          recipients,
          relatedData: {
            examId: exam._id,
            batchId: exam.batch._id
          }
        });
        
        await notification.save();
        
        // Real-time notifications
        const io = req.app.get('io');
        if (io) {
          recipients.forEach(recipient => {
            io.to(recipient.user.toString()).emit('examStatusUpdated', {
              examId: exam._id,
              title: exam.title,
              status,
              batchName: exam.batch.name,
              timestamp: new Date()
            });
          });
        }
      } catch (error) {
        console.error('Failed to send exam status update notifications:', error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Exam status updated to ${status}`,
      data: { exam }
    });
  })
);

// @route   POST /api/exams/:id/extend-time
// @desc    Extend time for specific student
// @access  Private (Admin, Teacher)
router.post('/:id/extend-time',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { studentId, extraMinutes, reason } = req.body;
    
    if (!extraMinutes || extraMinutes <= 0) {
      throw new AppError('Invalid extra minutes', 400);
    }
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name')
      .populate('teacher', 'firstName lastName');
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'teacher') {
      if (!exam.teacher._id.equals(req.user._id)) {
        throw new AppError('Access denied', 403);
      }
    }
    
    // Verify student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new AppError('Student not found', 404);
    }
    
    // Extend time
    await exam.extendTimeForStudent(studentId, extraMinutes);
    
    // Send notification to student
    try {
      const notification = new Notification({
        title: 'Exam Time Extended',
        message: `Your time for "${exam.title}" has been extended by ${extraMinutes} minutes. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'exam_time_extended',
        category: 'academic',
        priority: 'high',
        sender: req.user._id,
        recipients: [{ user: studentId, role: 'student' }]
      });
      
      await notification.save();
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(studentId.toString()).emit('examTimeExtended', {
          examId: exam._id,
          extraMinutes,
          reason,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send time extension notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: `Extended exam time by ${extraMinutes} minutes for student`,
      data: {
        studentId,
        extraMinutes,
        reason
      }
    });
  })
);

// @route   DELETE /api/exams/:id
// @desc    Delete exam (Admin only)
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const exam = await Exam.findById(id)
      .populate('batch', 'name')
      .populate('teacher', 'firstName lastName');
    
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }
    
    // Check if exam has submissions
    if (exam.submissions.length > 0) {
      throw new AppError('Cannot delete exam with submissions. Cancel instead.', 400);
    }
    
    await Exam.findByIdAndDelete(id);
    
    // Send notification
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('examDeleted', {
          examId: id,
          title: exam.title,
          batchName: exam.batch.name,
          teacherName: exam.teacher.firstName + ' ' + exam.teacher.lastName,
          deletedBy: req.user.firstName + ' ' + req.user.lastName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send exam deletion notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  })
);

// @route   GET /api/exams/batch/:batchId
// @desc    Get exams for specific batch
// @access  Private (Admin, Teacher, Student in batch, Parent)
router.get('/batch/:batchId',
  authenticateToken,
  queryValidation.pagination,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { batchId } = req.params;
    const { page, limit, skip } = getPaginationOptions(req);
    
    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'student') {
      const isEnrolled = batch.students.some(s => 
        s.student.equals(req.user._id) && s.status === 'active'
      );
      if (!isEnrolled) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const childrenIds = parent.children.map(child => child._id.toString());
      const hasChild = batch.students.some(s => 
        childrenIds.includes(s.student.toString()) && s.status === 'active'
      );
      if (!hasChild) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'teacher') {
      if (!batch.teacher.equals(req.user._id) && 
          !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
        throw new AppError('Access denied', 403);
      }
    }
    
    let query = { batch: batchId };
    
    // Filter by status for students/parents
    if (req.user.role === 'student' || req.user.role === 'parent') {
      query.status = { $in: ['published', 'active', 'completed'] };
    }
    
    // Add additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    const [exams, totalExams] = await Promise.all([
      Exam.find(query)
        .sort({ scheduleDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('teacher', 'firstName lastName')
        .select(req.user.role === 'admin' || req.user.role === 'teacher' ? 
          '' : '-questions.correctAnswer -questions.explanation')
        .lean(),
      Exam.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalExams / limit);
    
    res.status(200).json({
      success: true,
      data: {
        batch: {
          _id: batch._id,
          name: batch.name,
          code: batch.code,
          subject: batch.subject,
          grade: batch.grade
        },
        exams,
        pagination: {
          currentPage: page,
          totalPages,
          totalExams,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// Cron job to check for exam reminders and status updates
if (process.env.ENABLE_EXAM_REMINDERS === 'true') {
  // Check every hour for exam reminders
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔔 Running exam reminder check...');
      
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Find exams starting in 24 hours
      const dayReminders = await Exam.find({
        scheduleDate: {
          $gte: oneDayFromNow,
          $lte: new Date(oneDayFromNow.getTime() + 60 * 60 * 1000)
        },
        status: 'published'
      }).populate('batch', 'students name')
        .populate('teacher', 'firstName lastName');
      
      // Find exams starting in 1 hour
      const hourReminders = await Exam.find({
        scheduleDate: {
          $gte: oneHourFromNow,
          $lte: new Date(oneHourFromNow.getTime() + 60 * 60 * 1000)
        },
        status: 'published'
      }).populate('batch', 'students name')
        .populate('teacher', 'firstName lastName');
      
      // Send 24-hour reminders
      for (const exam of dayReminders) {
        const students = await User.find({
          _id: { $in: exam.batch.students.map(s => s.student) },
          status: 'active'
        }).select('_id firstName lastName email parentId');
        
        const recipients = [];
        for (const student of students) {
          recipients.push({ user: student._id, role: 'student' });
          if (student.parentId) {
            recipients.push({ user: student.parentId, role: 'parent' });
          }
        }
        
        const notification = new Notification({
          title: 'Exam Reminder - 24 Hours',
          message: `Reminder: ${exam.title} for ${exam.batch.name} is scheduled tomorrow at ${exam.startTime}`,
          type: 'exam_reminder',
          category: 'academic',
          priority: 'medium',
          sender: exam.teacher._id,
          recipients
        });
        
        await notification.save();
        console.log(`📅 Sent 24-hour reminder for ${exam.title}`);
      }
      
      // Send 1-hour reminders
      for (const exam of hourReminders) {
        const students = await User.find({
          _id: { $in: exam.batch.students.map(s => s.student) },
          status: 'active'
        }).select('_id firstName lastName email parentId');
        
        const recipients = [];
        for (const student of students) {
          recipients.push({ user: student._id, role: 'student' });
          if (student.parentId) {
            recipients.push({ user: student.parentId, role: 'parent' });
          }
        }
        
        const notification = new Notification({
          title: 'Exam Starting Soon - 1 Hour',
          message: `Important: ${exam.title} for ${exam.batch.name} starts in 1 hour at ${exam.startTime}`,
          type: 'exam_reminder',
          category: 'academic',
          priority: 'high',
          sender: exam.teacher._id,
          recipients
        });
        
        await notification.save();
        console.log(`⏰ Sent 1-hour reminder for ${exam.title}`);
      }
      
      // Auto-activate exams
      const examsToActivate = await Exam.find({
        scheduleDate: { $lte: now },
        startTime: { $lte: now.toTimeString().slice(0, 5) },
        status: 'published'
      });
      
      for (const exam of examsToActivate) {
        exam.status = 'active';
        await exam.save();
        console.log(`✅ Auto-activated exam: ${exam.title}`);
      }
      
      // Auto-complete exams
      const examsToComplete = await Exam.find({
        scheduleDate: { $lt: now },
        endTime: { $lt: now.toTimeString().slice(0, 5) },
        status: 'active'
      });
      
      for (const exam of examsToComplete) {
        exam.status = 'completed';
        await exam.save();
        console.log(`🏁 Auto-completed exam: ${exam.title}`);
      }
      
      console.log('✅ Exam reminder check completed');
    } catch (error) {
      console.error('❌ Error in exam reminder cron job:', error);
    }
  });
}
// Add these routes before the export statement

// @route   GET /api/exams/my-exams
// @desc    Get exams for teacher's batches
// @access  Private (Teacher)
router.get('/my-exams',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, batchId, status, type } = req.query;
    const teacherId = req.user._id;
    
    // Get teacher's batches
    const teacherBatches = await Batch.find({
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ]
    }).select('_id');
    
    const batchIds = teacherBatches.map(batch => batch._id);
    
    let matchQuery = {
      batch: { $in: batchIds }
    };
    
    if (batchId) {
      matchQuery.batch = batchId;
    }
    
    if (status) {
      matchQuery.status = status;
    }
    
    if (type) {
      matchQuery.type = type;
    }
    
    const exams = await Exam.find(matchQuery)
      .populate('batch', 'name code')
      .populate('teacher', 'firstName lastName')
      .sort({ examDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Exam.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: {
        exams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// @route   GET /api/exams/teacher-stats
// @desc    Get exam statistics for teacher
// @access  Private (Teacher)
router.get('/teacher-stats',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const teacherId = req.user._id;
    
    // Get teacher's batches
    const teacherBatches = await Batch.find({
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ]
    }).select('_id');
    
    const batchIds = teacherBatches.map(batch => batch._id);
    
    // Get exam statistics
    const stats = await Exam.aggregate([
      {
        $match: { batch: { $in: batchIds } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get type statistics
    const typeStats = await Exam.aggregate([
      {
        $match: { batch: { $in: batchIds } }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get upcoming exams count
    const upcomingCount = await Exam.countDocuments({
      batch: { $in: batchIds },
      examDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'active'] }
    });
    
    // Get completed exams count
    const completedCount = await Exam.countDocuments({
      batch: { $in: batchIds },
      status: 'completed'
    });
    
    // Format stats
    const formattedStats = {
      total: 0,
      scheduled: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      upcoming: upcomingCount,
      completedExams: completedCount
    };
    
    stats.forEach(stat => {
      formattedStats.total += stat.count;
      if (formattedStats.hasOwnProperty(stat._id)) {
        formattedStats[stat._id] = stat.count;
      }
    });
    
    const typeBreakdown = {};
    typeStats.forEach(stat => {
      typeBreakdown[stat._id] = stat.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...formattedStats,
        byType: typeBreakdown
      }
    });
  })
);

export default router;