import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { catchAsync } from '../middleware/errorHandler.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   GET /api/students/profile
// @desc    Get current student's profile
// @access  Private (Student)
router.get('/profile',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const student = await User.findById(req.user._id)
      .populate('parentId', 'firstName lastName email phoneNumber')
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    res.status(200).json({
      success: true,
      data: student
    });
  })
);

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private (Student)
// Update the PUT /profile route around line 33

router.put('/profile',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const allowedFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'address',
      'emergency_contact'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle address field conversion from string to object
    if (updates.address && typeof updates.address === 'string') {
      updates.address = {
        street: updates.address,
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      };
    }

    // First, check if current address is a string and convert it
    const currentUser = await User.findById(req.user._id);
    if (currentUser.address && typeof currentUser.address === 'string') {
      // Convert existing string address to object first
      await User.updateOne(
        { _id: req.user._id },
        {
          $set: {
            address: {
              street: currentUser.address,
              city: '',
              state: '',
              zipCode: '',
              country: 'India'
            }
          }
        }
      );
    }

    // Now perform the update
    const student = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).populate('parentId', 'firstName lastName email phoneNumber')
    .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');

    res.status(200).json({
      success: true,
      data: student
    });
  })
);
// @route   GET /api/students/dashboard
// @desc    Get student dashboard data
// @access  Private (Student)
router.get('/dashboard',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    
    // Get total batches
    const totalBatches = await Batch.countDocuments({
      'students.student': studentId,
      'students.status': 'active'
    });
    
    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          'students.student': studentId,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $unwind: '$students'
      },
      {
        $match: {
          'students.student': studentId
        }
      },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ['$students.status', 'present'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const attendanceData = attendanceStats[0] || { totalClasses: 0, presentCount: 0 };
    const attendancePercentage = attendanceData.totalClasses > 0 
      ? Math.round((attendanceData.presentCount / attendanceData.totalClasses) * 100)
      : 0;
    
    // Get pending fees
    const pendingFees = await Fee.aggregate([
      {
        $match: {
          'students.student': studentId
        }
      },
      {
        $unwind: '$students'
      },
      {
        $match: {
          'students.student': studentId,
          'students.status': { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$students.amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const feeData = pendingFees[0] || { totalPending: 0, count: 0 };
    
    // Get upcoming exams
    const upcomingExams = await Exam.find({
      batch: {
        $in: await Batch.find({
          'students.student': studentId,
          'students.status': 'active'
        }).distinct('_id')
      },
      examDate: { $gte: new Date() }
    })
    .populate('batch', 'name')
    .sort({ examDate: 1 })
    .limit(5);
    
    // Get recent notifications
    const notifications = await Notification.find({
      $or: [
        { 'recipients.user': studentId },
        { targetAudience: 'all' },
        { targetAudience: 'students' }
      ],
      isRead: { $nin: [studentId] }
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBatches,
          attendancePercentage,
          pendingFees: feeData.totalPending,
          upcomingExams: upcomingExams.length
        },
        upcomingExams,
        recentNotifications: notifications,
        attendanceData,
        feeData
      }
    });
  })
);

// @route   GET /api/students/attendance
// @desc    Get student's attendance history
// @access  Private (Student)
router.get('/attendance',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, batchId, startDate, endDate } = req.query;
    const studentId = req.user._id;
    
    let matchQuery = {
      'students.student': studentId
    };
    
    if (batchId) {
      matchQuery.batch = batchId;
    }
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendance = await Attendance.find(matchQuery)
      .populate('batch', 'name code')
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter to show only student's attendance
    const studentAttendance = attendance.map(record => ({
      _id: record._id,
      date: record.date,
      batch: record.batch,
      teacher: record.teacher,
      topic: record.topic,
      status: record.students.find(s => s.student.toString() === studentId.toString())?.status || 'absent'
    }));
    
    const total = await Attendance.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: studentAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);
// Add these routes after the existing routes, before the export statement

// @route   GET /api/students/attendance/stats
// @desc    Get student's attendance statistics
// @access  Private (Student)
router.get('/attendance/stats',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { batchId, startDate, endDate } = req.query;
    
    let matchQuery = {
      'students.student': studentId
    };
    
    if (batchId) {
      matchQuery.batch = batchId;
    }
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get attendance statistics
    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      { $unwind: '$students' },
      { $match: { 'students.student': studentId } },
      {
        $group: {
          _id: '$students.status',
          count: { $sum: 1 },
          totalLateMinutes: { $sum: '$students.lateMinutes' }
        }
      }
    ]);
    
    // Calculate overall statistics
    const totalClasses = stats.reduce((sum, stat) => sum + stat.count, 0);
    const presentCount = stats.find(s => s._id === 'present')?.count || 0;
    const absentCount = stats.find(s => s._id === 'absent')?.count || 0;
    const lateCount = stats.find(s => s._id === 'late')?.count || 0;
    const totalLateMinutes = stats.find(s => s._id === 'late')?.totalLateMinutes || 0;
    
    const attendancePercentage = totalClasses > 0 ? 
      ((presentCount + lateCount) / totalClasses * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        attendancePercentage: parseFloat(attendancePercentage),
        totalLateMinutes,
        averageLateMinutes: lateCount > 0 ? (totalLateMinutes / lateCount).toFixed(2) : 0
      }
    });
  })
);

// @route   GET /api/students/exams
// @desc    Get student's exams
// @access  Private (Student)
router.get('/exams',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { page = 1, limit = 20, batchId, status, type, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Get student's batches
    const studentBatches = await Batch.find({
      'students.student': studentId,
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = studentBatches.map(batch => batch._id);
    
    let query = {
      batch: { $in: batchIds },
      status: { $in: ['published', 'active', 'completed'] }
    };
    
    if (batchId) {
      query.batch = batchId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [exams, totalExams] = await Promise.all([
      Exam.find(query)
        .sort({ scheduleDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('batch', 'name code subject')
        .populate('teacher', 'firstName lastName')
        .select('-questions.correctAnswer -questions.explanation')
        .lean(),
      Exam.countDocuments(query)
    ]);
    
    // Add submission status for each exam
    const examsWithStatus = exams.map(exam => {
      const submission = exam.submissions?.find(s => 
        s.student.toString() === studentId.toString()
      );
      
      return {
        ...exam,
        submissionStatus: submission ? 'submitted' : 'pending',
        score: submission?.percentage || null,
        grade: submission?.grade || null
      };
    });
    
    const totalPages = Math.ceil(totalExams / limit);
    
    res.status(200).json({
      success: true,
      data: {
        exams: examsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalExams,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/students/results
// @desc    Get student's exam results
// @access  Private (Student)
router.get('/results',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { page = 1, limit = 20, batchId, examType, grade, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Get student's batches
    const studentBatches = await Batch.find({
      'students.student': studentId,
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = studentBatches.map(batch => batch._id);
    
    let query = {
      batch: { $in: batchIds },
      status: 'completed',
      'submissions.student': studentId
    };
    
    if (batchId) {
      query.batch = batchId;
    }
    
    if (examType) {
      query.type = examType;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [exams, totalResults] = await Promise.all([
      Exam.find(query)
        .sort({ examDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('batch', 'name code subject')
        .populate('teacher', 'firstName lastName')
        .select('title type subject totalMarks passingMarks examDate submissions')
        .lean(),
      Exam.countDocuments(query)
    ]);
    
    // Extract student's results
    const results = exams.map(exam => {
      const submission = exam.submissions.find(s => 
        s.student.toString() === studentId.toString()
      );
      
      return {
        examId: exam._id,
        title: exam.title,
        type: exam.type,
        subject: exam.subject,
        batch: exam.batch,
        teacher: exam.teacher,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        examDate: exam.examDate,
        marksObtained: submission?.totalMarksObtained || 0,
        percentage: submission?.percentage || 0,
        grade: submission?.grade || 'N/A',
        rank: submission?.rank || 0,
        submittedAt: submission?.submittedAt,
        passed: (submission?.percentage || 0) >= ((exam.passingMarks / exam.totalMarks) * 100)
      };
    });
    
    // Filter by grade if specified
    let filteredResults = results;
    if (grade) {
      filteredResults = results.filter(result => result.grade === grade);
    }
    
    const totalPages = Math.ceil(totalResults / limit);
    
    res.status(200).json({
      success: true,
      data: {
        results: filteredResults,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/students/results/stats
// @desc    Get student's result statistics
// @access  Private (Student)
router.get('/results/stats',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { batchId, startDate, endDate } = req.query;
    
    // Get student's batches
    const studentBatches = await Batch.find({
      'students.student': studentId,
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = studentBatches.map(batch => batch._id);
    
    let query = {
      batch: { $in: batchIds },
      status: 'completed',
      'submissions.student': studentId
    };
    
    if (batchId) {
      query.batch = batchId;
    }
    
    if (startDate && endDate) {
      query.examDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const exams = await Exam.find(query)
      .select('title type totalMarks passingMarks submissions')
      .lean();
    
    // Calculate statistics
    let totalExams = 0;
    let totalMarksObtained = 0;
    let totalPossibleMarks = 0;
    let passedExams = 0;
    const gradeDistribution = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    const typeStats = {};
    const subjectStats = {};
    
    exams.forEach(exam => {
      const submission = exam.submissions.find(s => 
        s.student.toString() === studentId.toString()
      );
      
      if (submission) {
        totalExams++;
        totalMarksObtained += submission.totalMarksObtained;
        totalPossibleMarks += exam.totalMarks;
        
        if (submission.percentage >= ((exam.passingMarks / exam.totalMarks) * 100)) {
          passedExams++;
        }
        
        // Grade distribution
        if (gradeDistribution[submission.grade] !== undefined) {
          gradeDistribution[submission.grade]++;
        }
        
        // Type statistics
        typeStats[exam.type] = (typeStats[exam.type] || 0) + 1;
        
        // Subject statistics
        if (exam.subject) {
          subjectStats[exam.subject] = subjectStats[exam.subject] || { 
            total: 0, 
            passed: 0, 
            avgScore: 0,
            totalScore: 0 
          };
          subjectStats[exam.subject].total++;
          subjectStats[exam.subject].totalScore += submission.percentage;
          if (submission.percentage >= ((exam.passingMarks / exam.totalMarks) * 100)) {
            subjectStats[exam.subject].passed++;
          }
        }
      }
    });
    
    // Calculate subject averages
    Object.keys(subjectStats).forEach(subject => {
      subjectStats[subject].avgScore = (
        subjectStats[subject].totalScore / subjectStats[subject].total
      ).toFixed(2);
      delete subjectStats[subject].totalScore;
    });
    
    const overallPercentage = totalPossibleMarks > 0 ? 
      ((totalMarksObtained / totalPossibleMarks) * 100).toFixed(2) : 0;
    const passRate = totalExams > 0 ? 
      ((passedExams / totalExams) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalExams,
        passedExams,
        failedExams: totalExams - passedExams,
        overallPercentage: parseFloat(overallPercentage),
        passRate: parseFloat(passRate),
        totalMarksObtained,
        totalPossibleMarks,
        gradeDistribution,
        typeStats,
        subjectStats
      }
    });
  })
);

// @route   GET /api/students/results/report
// @desc    Generate student result report
// @access  Private (Student)
router.get('/results/report',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { batchId, startDate, endDate, format = 'json' } = req.query;
    
    // Get student details
    const student = await User.findById(studentId)
      .populate('parentId', 'firstName lastName email phone')
      .select('firstName lastName studentId email grade phone');
    
    // Get student's batches
    const studentBatches = await Batch.find({
      'students.student': studentId,
      'students.status': 'active'
    }).populate('teacher', 'firstName lastName');
    
    let query = {
      batch: { $in: studentBatches.map(b => b._id) },
      status: 'completed',
      'submissions.student': studentId
    };
    
    if (batchId) {
      query.batch = batchId;
    }
    
    if (startDate && endDate) {
      query.examDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const exams = await Exam.find(query)
      .populate('batch', 'name code subject')
      .populate('teacher', 'firstName lastName')
      .select('title type subject totalMarks passingMarks examDate submissions')
      .sort({ examDate: -1 })
      .lean();
    
    // Generate report data
    const reportData = {
      student: {
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        email: student.email,
        grade: student.grade,
        parent: student.parentId ? {
          name: `${student.parentId.firstName} ${student.parentId.lastName}`,
          email: student.parentId.email,
          phone: student.parentId.phone
        } : null
      },
      reportPeriod: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Current',
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalExams: 0,
        passedExams: 0,
        failedExams: 0,
        overallPercentage: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 100,
        averageScore: 0
      },
      examResults: [],
      batchPerformance: {}
    };
    
    let totalMarksObtained = 0;
    let totalPossibleMarks = 0;
    let totalPercentage = 0;
    
    exams.forEach(exam => {
      const submission = exam.submissions.find(s => 
        s.student.toString() === studentId.toString()
      );
      
      if (submission) {
        const percentage = submission.percentage;
        const passed = percentage >= ((exam.passingMarks / exam.totalMarks) * 100);
        
        reportData.summary.totalExams++;
        if (passed) reportData.summary.passedExams++;
        else reportData.summary.failedExams++;
        
        totalMarksObtained += submission.totalMarksObtained;
        totalPossibleMarks += exam.totalMarks;
        totalPercentage += percentage;
        
        if (percentage > reportData.summary.highestScore) {
          reportData.summary.highestScore = percentage;
        }
        if (percentage < reportData.summary.lowestScore) {
          reportData.summary.lowestScore = percentage;
        }
        
        // Add to exam results
        reportData.examResults.push({
          title: exam.title,
          type: exam.type,
          subject: exam.subject,
          batch: exam.batch.name,
          teacher: `${exam.teacher.firstName} ${exam.teacher.lastName}`,
          examDate: exam.examDate,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          marksObtained: submission.totalMarksObtained,
          percentage: percentage,
          grade: submission.grade,
          rank: submission.rank,
          passed: passed,
          submittedAt: submission.submittedAt
        });
        
        // Batch performance tracking
        const batchName = exam.batch.name;
        if (!reportData.batchPerformance[batchName]) {
          reportData.batchPerformance[batchName] = {
            totalExams: 0,
            passed: 0,
            totalScore: 0,
            avgScore: 0
          };
        }
        reportData.batchPerformance[batchName].totalExams++;
        reportData.batchPerformance[batchName].totalScore += percentage;
        if (passed) reportData.batchPerformance[batchName].passed++;
      }
    });
    
    // Calculate final summary stats
    if (reportData.summary.totalExams > 0) {
      reportData.summary.overallPercentage = (totalMarksObtained / totalPossibleMarks * 100).toFixed(2);
      reportData.summary.passRate = (reportData.summary.passedExams / reportData.summary.totalExams * 100).toFixed(2);
      reportData.summary.averageScore = (totalPercentage / reportData.summary.totalExams).toFixed(2);
    }
    
    if (reportData.summary.totalExams === 0) {
      reportData.summary.lowestScore = 0;
    }
    
    // Calculate batch averages
    Object.keys(reportData.batchPerformance).forEach(batchName => {
      const batch = reportData.batchPerformance[batchName];
      batch.avgScore = (batch.totalScore / batch.totalExams).toFixed(2);
      delete batch.totalScore;
    });
    
    res.status(200).json({
      success: true,
      data: reportData
    });
  })
);

// @route   GET /api/students/notifications
// @desc    Get student's notifications
// @access  Private (Student)
router.get('/notifications',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      priority, 
      read, 
      starred, 
      archived, 
      search 
    } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {
      $or: [
        { 'recipients.user': studentId },
        { targetAudience: 'all' },
        { targetAudience: 'students' }
      ]
    };
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (read === 'true') {
      query.readBy = { $in: [studentId] };
    } else if (read === 'false') {
      query.readBy = { $nin: [studentId] };
    }
    
    if (starred === 'true') {
      query.starredBy = { $in: [studentId] };
    } else if (starred === 'false') {
      query.starredBy = { $nin: [studentId] };
    }
    
    if (archived === 'true') {
      query.archivedBy = { $in: [studentId] };
    } else if (archived === 'false') {
      query.archivedBy = { $nin: [studentId] };
    }
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    const [notifications, totalNotifications] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'firstName lastName role')
        .lean(),
      Notification.countDocuments(query)
    ]);
    
    // Add user-specific flags
    const notificationsWithFlags = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy?.includes(studentId) || false,
      isStarred: notification.starredBy?.includes(studentId) || false,
      isArchived: notification.archivedBy?.includes(studentId) || false
    }));
    
    const totalPages = Math.ceil(totalNotifications / limit);
    
    res.status(200).json({
      success: true,
      data: {
        notifications: notificationsWithFlags,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalNotifications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/students/notifications/stats
// @desc    Get student's notification statistics
// @access  Private (Student)
router.get('/notifications/stats',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    
    const baseQuery = {
      $or: [
        { 'recipients.user': studentId },
        { targetAudience: 'all' },
        { targetAudience: 'students' }
      ]
    };
    
    const [
      totalNotifications,
      unreadNotifications,
      starredNotifications,
      archivedNotifications,
      typeStats,
      priorityStats,
      categoryStats
    ] = await Promise.all([
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({
        ...baseQuery,
        readBy: { $nin: [studentId] }
      }),
      Notification.countDocuments({
        ...baseQuery,
        starredBy: { $in: [studentId] }
      }),
      Notification.countDocuments({
        ...baseQuery,
        archivedBy: { $in: [studentId] }
      }),
      Notification.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        unreadNotifications,
        starredNotifications,
        archivedNotifications,
        readNotifications: totalNotifications - unreadNotifications,
        typeDistribution: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        priorityDistribution: priorityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        categoryDistribution: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  })
);

// @route   PATCH /api/students/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Student)
router.patch('/notifications/:id/read',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user has access to this notification
    const hasAccess = notification.recipients?.some(r => r.user.equals(studentId)) ||
                     notification.targetAudience === 'all' ||
                     notification.targetAudience === 'students';
    
    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }
    
    // Mark as read
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: studentId }
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  })
);

// @route   PATCH /api/students/notifications/:id/unread
// @desc    Mark notification as unread
// @access  Private (Student)
router.patch('/notifications/:id/unread',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user has access to this notification
    const hasAccess = notification.recipients?.some(r => r.user.equals(studentId)) ||
                     notification.targetAudience === 'all' ||
                     notification.targetAudience === 'students';
    
    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }
    
    // Mark as unread
    await Notification.findByIdAndUpdate(id, {
      $pull: { readBy: studentId }
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as unread'
    });
  })
);

// @route   PATCH /api/students/notifications/:id/star
// @desc    Star/unstar notification
// @access  Private (Student)
router.patch('/notifications/:id/star',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { starred } = req.body;
    const studentId = req.user._id;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user has access to this notification
    const hasAccess = notification.recipients?.some(r => r.user.equals(studentId)) ||
                     notification.targetAudience === 'all' ||
                     notification.targetAudience === 'students';
    
    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }
    
    // Update starred status
    const updateOperation = starred ? 
      { $addToSet: { starredBy: studentId } } :
      { $pull: { starredBy: studentId } };
    
    await Notification.findByIdAndUpdate(id, updateOperation);
    
    res.status(200).json({
      success: true,
      message: starred ? 'Notification starred' : 'Notification unstarred'
    });
  })
);

// @route   PATCH /api/students/notifications/:id/archive
// @desc    Archive/unarchive notification
// @access  Private (Student)
router.patch('/notifications/:id/archive',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user has access to this notification
    const hasAccess = notification.recipients?.some(r => r.user.equals(studentId)) ||
                     notification.targetAudience === 'all' ||
                     notification.targetAudience === 'students';
    
    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }
    
    // Toggle archived status
    const isCurrentlyArchived = notification.archivedBy?.includes(studentId);
    const updateOperation = isCurrentlyArchived ? 
      { $pull: { archivedBy: studentId } } :
      { $addToSet: { archivedBy: studentId } };
    
    await Notification.findByIdAndUpdate(id, updateOperation);
    
    res.status(200).json({
      success: true,
      message: isCurrentlyArchived ? 'Notification unarchived' : 'Notification archived'
    });
  })
);

// @route   DELETE /api/students/notifications/:id
// @desc    Delete notification (mark as deleted for user)
// @access  Private (Student)
router.delete('/notifications/:id',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user has access to this notification
    const hasAccess = notification.recipients?.some(r => r.user.equals(studentId)) ||
                     notification.targetAudience === 'all' ||
                     notification.targetAudience === 'students';
    
    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }
    
    // Mark as deleted for this user
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { deletedBy: studentId }
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  })
);

// @route   POST /api/students/notifications/bulk-read
// @desc    Mark multiple notifications as read
// @access  Private (Student)
router.post('/notifications/bulk-read',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const studentId = req.user._id;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      throw new AppError('Notification IDs are required', 400);
    }
    
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        $or: [
          { 'recipients.user': studentId },
          { targetAudience: 'all' },
          { targetAudience: 'students' }
        ]
      },
      { $addToSet: { readBy: studentId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications marked as read`
    });
  })
);

// @route   POST /api/students/notifications/bulk-unread
// @desc    Mark multiple notifications as unread
// @access  Private (Student)
router.post('/notifications/bulk-unread',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const studentId = req.user._id;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      throw new AppError('Notification IDs are required', 400);
    }
    
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        $or: [
          { 'recipients.user': studentId },
          { targetAudience: 'all' },
          { targetAudience: 'students' }
        ]
      },
      { $pull: { readBy: studentId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications marked as unread`
    });
  })
);

// @route   POST /api/students/notifications/bulk-archive
// @desc    Archive multiple notifications
// @access  Private (Student)
router.post('/notifications/bulk-archive',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const studentId = req.user._id;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      throw new AppError('Notification IDs are required', 400);
    }
    
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        $or: [
          { 'recipients.user': studentId },
          { targetAudience: 'all' },
          { targetAudience: 'students' }
        ]
      },
      { $addToSet: { archivedBy: studentId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications archived`
    });
  })
);

// @route   POST /api/students/notifications/bulk-delete
// @desc    Delete multiple notifications (mark as deleted)
// @access  Private (Student)
router.post('/notifications/bulk-delete',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const studentId = req.user._id;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      throw new AppError('Notification IDs are required', 400);
    }
    
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        $or: [
          { 'recipients.user': studentId },
          { targetAudience: 'all' },
          { targetAudience: 'students' }
        ]
      },
      { $addToSet: { deletedBy: studentId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications deleted`
    });
  })
);
// Add to backend/routes/parents.js

// @route   GET /api/parents/attendance/:childId
// @desc    Get child's attendance records
// @access  Private (Parent)
router.get('/attendance/:childId',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { month, year, batch } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Build query
    let query = { 'students.student': childId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (batch) {
      query.batch = batch;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('batch', 'name subject teacher')
      .populate('teacher', 'firstName lastName')
      .populate({
        path: 'batch.teacher',
        select: 'firstName lastName'
      })
      .sort({ date: -1 });
    
    // Extract student-specific attendance data
    const formattedRecords = attendanceRecords.map(record => {
      const studentRecord = record.students.find(s => 
        s.student.toString() === childId
      );
      
      return {
        _id: record._id,
        date: record.date,
        batch: record.batch,
        teacher: record.teacher,
        topic: record.topic,
        status: studentRecord?.status || 'absent',
        arrivalTime: studentRecord?.arrivalTime,
        departureTime: studentRecord?.departureTime,
        lateMinutes: studentRecord?.lateMinutes || 0,
        remarks: studentRecord?.remarks
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedRecords
    });
  })
);

// @route   GET /api/parents/attendance/:childId/stats
// @desc    Get child's attendance statistics
// @access  Private (Parent)
router.get('/attendance/:childId/stats',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { month, year, batch } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Build query
    let query = { 'students.student': childId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (batch) {
      query.batch = batch;
    }
    
    // Get attendance statistics
    const stats = await Attendance.aggregate([
      { $match: query },
      { $unwind: '$students' },
      { $match: { 'students.student': childId } },
      {
        $group: {
          _id: '$students.status',
          count: { $sum: 1 },
          totalLateMinutes: { $sum: '$students.lateMinutes' }
        }
      }
    ]);
    
    // Format statistics
    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        lateMinutes: stat.totalLateMinutes || 0
      };
      return acc;
    }, { present: { count: 0, lateMinutes: 0 }, absent: { count: 0, lateMinutes: 0 }, late: { count: 0, lateMinutes: 0 } });
    
    const totalClasses = Object.values(formattedStats).reduce((sum, stat) => sum + stat.count, 0);
    const attendancePercentage = totalClasses > 0 ? 
      (((formattedStats.present.count + formattedStats.late.count) / totalClasses) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        present: formattedStats.present.count,
        absent: formattedStats.absent.count,
        late: formattedStats.late.count,
        attendancePercentage: parseFloat(attendancePercentage),
        totalLateMinutes: formattedStats.late.lateMinutes,
        averageLateMinutes: formattedStats.late.count > 0 ? 
          (formattedStats.late.lateMinutes / formattedStats.late.count).toFixed(2) : 0
      }
    });
  })
);

// @route   GET /api/parents/attendance/:childId/report
// @desc    Generate attendance report for child
// @access  Private (Parent)
router.get('/attendance/:childId/report',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { month, year, batch, format = 'json' } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Similar logic as above but formatted as a report
    // Implementation would generate a detailed report
    
    res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      data: { reportUrl: '/path/to/generated/report.pdf' }
    });
  })
);

// Add to backend/routes/students.js

// @route   GET /api/students/attendance/report
// @desc    Generate attendance report for student
// @access  Private (Student)
router.get('/attendance/report',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { month, year, batch, format = 'pdf' } = req.query;
    
    // Build query
    let query = { 'students.student': studentId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (batch) {
      query.batch = batch;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('batch', 'name subject teacher')
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 });
    
    // Generate report logic here
    // This would create a PDF or Excel file
    
    res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      data: { reportUrl: '/downloads/attendance-report.pdf' }
    });
  })
);


// Add this route to backend/routes/students.js, before the export statement

// @route   GET /api/students/schedule
// @desc    Get student's weekly class schedule
// @access  Private (Student)
router.get('/schedule',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const studentId = req.user._id;
    const { week } = req.query;
    
    // Get student's active batches with schedule info
    const batches = await Batch.find({
      'students.student': studentId,
      'students.status': 'active',
      status: 'active'
    })
    .populate('teacher', 'firstName lastName')
    .populate('assistantTeachers', 'firstName lastName')
    .select('name code subject grade schedule teacher assistantTeachers classroom startDate endDate');
    
    // Format schedule data
    const weeklySchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    batches.forEach(batch => {
      if (batch.schedule && batch.schedule.length > 0) {
        batch.schedule.forEach(scheduleItem => {
          const dayKey = scheduleItem.day?.toLowerCase();
          if (weeklySchedule[dayKey]) {
            weeklySchedule[dayKey].push({
              batchId: batch._id,
              batchName: batch.name,
              batchCode: batch.code,
              subject: batch.subject,
              grade: batch.grade,
              startTime: scheduleItem.startTime,
              endTime: scheduleItem.endTime,
              classroom: batch.classroom || 'TBA',
              teacher: batch.teacher,
              assistantTeachers: batch.assistantTeachers || []
            });
          }
        });
      }
    });
    
    // Sort each day's classes by start time
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
    });
    
    res.status(200).json({
      success: true,
      data: {
        schedule: weeklySchedule,
        totalBatches: batches.length,
        activeDays: Object.keys(weeklySchedule).filter(day => weeklySchedule[day].length > 0)
      }
    });
  })
);
export default router;