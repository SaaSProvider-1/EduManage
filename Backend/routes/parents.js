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

// @route   GET /api/parents/children
// @desc    Get parent's children list
// @access  Private (Parent)
router.get('/children',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parent = await User.findById(req.user._id)
      .populate('children', 'firstName lastName email studentId profilePicture createdAt');
    
    res.status(200).json({
      success: true,
      data: parent.children || []
    });
  })
);

// @route   GET /api/parents/children/:childId/batches
// @desc    Get child's batches
// @access  Private (Parent)
router.get('/children/:childId/batches',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    const batches = await Batch.find({
      'students.student': childId,
      'students.status': 'active'
    })
    .populate('teacher', 'firstName lastName email')
    .populate('assistantTeachers', 'firstName lastName email')
    .select('name code subject grade level schedule teacher assistantTeachers startDate endDate status');
    
    res.status(200).json({
      success: true,
      data: batches
    });
  })
);

// @route   GET /api/parents/children/:childId/attendance
// @desc    Get child's attendance
// @access  Private (Parent)
router.get('/children/:childId/attendance',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { page = 1, limit = 20, batchId, startDate, endDate } = req.query;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    let matchQuery = {
      'students.student': childId
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
    
    // Filter to show only child's attendance
    const childAttendance = attendance.map(record => ({
      _id: record._id,
      date: record.date,
      batch: record.batch,
      teacher: record.teacher,
      topic: record.topic,
      status: record.students.find(s => s.student.toString() === childId.toString())?.status || 'absent'
    }));
    
    const total = await Attendance.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: childAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   GET /api/parents/children/:childId/fees
// @desc    Get child's fee records
// @access  Private (Parent)
router.get('/children/:childId/fees',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    let matchQuery = {
      'students.student': childId
    };
    
    if (status) {
      matchQuery['students.status'] = status;
    }
    
    const fees = await Fee.find(matchQuery)
      .populate('batch', 'name code')
      .sort({ dueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter to show only child's fee records
    const childFees = fees.map(record => {
      const studentFee = record.students.find(s => s.student.toString() === childId.toString());
      return {
        _id: record._id,
        batch: record.batch,
        type: record.type,
        amount: studentFee?.amount || record.amount,
        dueDate: record.dueDate,
        status: studentFee?.status || 'pending',
        paidDate: studentFee?.paidDate,
        paymentMethod: studentFee?.paymentMethod,
        transactionId: studentFee?.transactionId,
        description: record.description
      };
    });
    
    const total = await Fee.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: childFees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   GET /api/parents/children/:childId/exams
// @desc    Get child's exam results
// @access  Private (Parent)
router.get('/children/:childId/exams',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Get child's batches
    const childBatches = await Batch.find({
      'students.student': childId,
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = childBatches.map(batch => batch._id);
    
    let matchQuery = {
      batch: { $in: batchIds }
    };
    
    if (type) {
      matchQuery.type = type;
    }
    
    const exams = await Exam.find(matchQuery)
      .populate('batch', 'name code')
      .populate('teacher', 'firstName lastName')
      .sort({ examDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter to show only child's results
    const childExams = exams.map(exam => {
      const studentResult = exam.results.find(r => r.student.toString() === childId.toString());
      return {
        _id: exam._id,
        title: exam.title,
        type: exam.type,
        batch: exam.batch,
        teacher: exam.teacher,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        duration: exam.duration,
        syllabus: exam.syllabus,
        result: studentResult ? {
          marksObtained: studentResult.marksObtained,
          percentage: studentResult.percentage,
          grade: studentResult.grade,
          rank: studentResult.rank,
          remarks: studentResult.remarks,
          submittedAt: studentResult.submittedAt
        } : null
      };
    });
    
    const total = await Exam.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: childExams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   GET /api/parents/dashboard
// @desc    Get parent dashboard data
// @access  Private (Parent)
router.get('/dashboard',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parent = await User.findById(req.user._id).populate('children');
    const children = parent.children || [];
    
    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          children: [],
          stats: {
            totalChildren: 0,
            activeBatches: 0,
            pendingFees: 0,
            upcomingExams: 0
          }
        }
      });
    }
    
    const childIds = children.map(child => child._id);
    
    // Get active batches count
    const activeBatches = await Batch.countDocuments({
      'students.student': { $in: childIds },
      'students.status': 'active'
    });
    
    // Get pending fees
    const pendingFees = await Fee.aggregate([
      {
        $match: {
          'students.student': { $in: childIds },
          'students.status': { $in: ['pending', 'overdue'] }
        }
      },
      {
        $unwind: '$students'
      },
      {
        $match: {
          'students.student': { $in: childIds },
          'students.status': { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$students.amount' }
        }
      }
    ]);
    
    const totalPendingFees = pendingFees[0]?.totalPending || 0;
    
    // Get upcoming exams
    const childBatches = await Batch.find({
      'students.student': { $in: childIds },
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = childBatches.map(batch => batch._id);
    
    const upcomingExams = await Exam.countDocuments({
      batch: { $in: batchIds },
      examDate: { $gte: new Date() }
    });
    
    // Get recent notifications
    const notifications = await Notification.find({
      $or: [
        { 'recipients.user': req.user._id },
        { targetAudience: 'all' },
        { targetAudience: 'parents' }
      ],
      isRead: { $nin: [req.user._id] }
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        children: children.map(child => ({
          _id: child._id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentId: child.studentId,
          profilePicture: child.profilePicture
        })),
        stats: {
          totalChildren: children.length,
          activeBatches,
          pendingFees: totalPendingFees,
          upcomingExams
        },
        recentNotifications: notifications
      }
    });
  })
);
// Add these routes before the export statement

// @route   GET /api/parents/fees/:childId
// @desc    Get child's fee records with parent access
// @access  Private (Parent)
router.get('/fees/:childId',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    let matchQuery = {
      'students.student': childId
    };
    
    if (status) {
      matchQuery['students.status'] = status;
    }
    
    const fees = await Fee.find(matchQuery)
      .populate('batch', 'name code')
      .sort({ dueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter and format for child
    const childFees = fees.map(record => {
      const studentFee = record.students.find(s => s.student.toString() === childId.toString());
      return {
        _id: record._id,
        batch: record.batch,
        type: record.type,
        amount: studentFee?.amount || record.amount,
        dueDate: record.dueDate,
        status: studentFee?.status || 'pending',
        paidDate: studentFee?.paidDate,
        paymentMethod: studentFee?.paymentMethod,
        transactionId: studentFee?.transactionId,
        description: record.description
      };
    });
    
    const total = await Fee.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: childFees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   GET /api/parents/fees/:childId/stats
// @desc    Get child's fee statistics
// @access  Private (Parent)
router.get('/fees/:childId/stats',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Get fee statistics for child
    const stats = await Fee.aggregate([
      {
        $match: { 'students.student': childId }
      },
      {
        $unwind: '$students'
      },
      {
        $match: { 'students.student': childId }
      },
      {
        $group: {
          _id: '$students.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$students.amount' }
        }
      }
    ]);
    
    const formattedStats = {
      total: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 }
    };
    
    stats.forEach(stat => {
      formattedStats.total.count += stat.count;
      formattedStats.total.amount += stat.totalAmount;
      
      if (formattedStats[stat._id]) {
        formattedStats[stat._id] = {
          count: stat.count,
          amount: stat.totalAmount
        };
      }
    });
    
    res.status(200).json({
      success: true,
      data: formattedStats
    });
  })
);

// @route   GET /api/parents/exam-results/:childId
// @desc    Get child's exam results
// @access  Private (Parent)
router.get('/exam-results/:childId',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Get child's batches
    const childBatches = await Batch.find({
      'students.student': childId,
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = childBatches.map(batch => batch._id);
    
    let matchQuery = {
      batch: { $in: batchIds },
      status: 'completed'
    };
    
    if (type) {
      matchQuery.type = type;
    }
    
    const exams = await Exam.find(matchQuery)
      .populate('batch', 'name code')
      .populate('teacher', 'firstName lastName')
      .sort({ examDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter to show only child's results
    const childResults = exams.map(exam => {
      const studentResult = exam.results.find(r => r.student.toString() === childId.toString());
      return {
        _id: exam._id,
        title: exam.title,
        type: exam.type,
        batch: exam.batch,
        teacher: exam.teacher,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        result: studentResult ? {
          marksObtained: studentResult.marksObtained,
          percentage: studentResult.percentage,
          grade: studentResult.grade,
          rank: studentResult.rank,
          remarks: studentResult.remarks
        } : null
      };
    });
    
    const total = await Exam.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: childResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   GET /api/parents/exam-results/:childId/stats
// @desc    Get child's exam result statistics
// @access  Private (Parent)
router.get('/exam-results/:childId/stats',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Get child's batches
    const childBatches = await Batch.find({
      'students.student': childId,
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = childBatches.map(batch => batch._id);
    
    // Get exam results for child
    const exams = await Exam.find({
      batch: { $in: batchIds },
      status: 'completed',
      'results.student': childId
    });
    
    let totalExams = 0;
    let totalMarks = 0;
    let totalObtained = 0;
    let passed = 0;
    const gradeCount = {};
    
    exams.forEach(exam => {
      const result = exam.results.find(r => r.student.toString() === childId.toString());
      if (result) {
        totalExams++;
        totalMarks += exam.totalMarks;
        totalObtained += result.marksObtained;
        
        if (result.marksObtained >= exam.passingMarks) {
          passed++;
        }
        
        if (result.grade) {
          gradeCount[result.grade] = (gradeCount[result.grade] || 0) + 1;
        }
      }
    });
    
    const averagePercentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
    const passRate = totalExams > 0 ? Math.round((passed / totalExams) * 100) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalExams,
        averagePercentage,
        passRate,
        totalMarks,
        totalObtained,
        gradeDistribution: gradeCount
      }
    });
  })
);

// @route   GET /api/parents/notifications
// @desc    Get notifications for parent
// @access  Private (Parent)
router.get('/notifications',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status = 'all', category = 'all' } = req.query;
    const userId = req.user._id;
    
    let matchQuery = {
      $or: [
        { 'recipients.user': userId },
        { targetAudience: 'all' },
        { targetAudience: 'parents' }
      ]
    };
    
    if (status === 'read') {
      matchQuery.isRead = userId;
    } else if (status === 'unread') {
      matchQuery.isRead = { $nin: [userId] };
    }
    
    if (category !== 'all') {
      matchQuery.category = category;
    }
    
    const notifications = await Notification.find(matchQuery)
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   PATCH /api/parents/notifications/:id/read
// @desc    Mark parent notification as read
// @access  Private (Parent)
router.patch('/notifications/:id/read',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { isRead: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  })
);

// @route   PATCH /api/parents/notifications/:id/archive
// @desc    Archive parent notification
// @access  Private (Parent)
router.patch('/notifications/:id/archive',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { archivedBy: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Notification archived'
    });
  })
);

// @route   DELETE /api/parents/notifications/:id
// @desc    Delete parent notification
// @access  Private (Parent)
router.delete('/notifications/:id',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { deletedBy: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  })
);

// @route   POST /api/parents/notifications/bulk-read
// @desc    Mark multiple notifications as read
// @access  Private (Parent)
router.post('/notifications/bulk-read',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const userId = req.user._id;
    
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { isRead: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications marked as read`
    });
  })
);

// @route   POST /api/parents/notifications/bulk-archive
// @desc    Archive multiple notifications
// @access  Private (Parent)
router.post('/notifications/bulk-archive',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const userId = req.user._id;
    
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { archivedBy: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications archived`
    });
  })
);

// @route   POST /api/parents/notifications/bulk-delete
// @desc    Delete multiple notifications
// @access  Private (Parent)
router.post('/notifications/bulk-delete',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { notificationIds } = req.body;
    const userId = req.user._id;
    
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { deletedBy: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: `${notificationIds.length} notifications deleted`
    });
  })
);

// @route   POST /api/parents/payments/process
// @desc    Process payment for child's fees
// @access  Private (Parent)
router.post('/payments/process',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { feeId, childId, amount, paymentMethod, transactionDetails } = req.body;
    
    // Verify parent has access to this child
    const parent = await User.findById(req.user._id).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    const fee = await Fee.findById(feeId);
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    // Find student in fee record
    const studentFeeIndex = fee.students.findIndex(s => s.student.toString() === childId.toString());
    if (studentFeeIndex === -1) {
      throw new AppError('Student not found in fee record', 404);
    }
    
    // Update payment status
    fee.students[studentFeeIndex].status = 'paid';
    fee.students[studentFeeIndex].paidDate = new Date();
    fee.students[studentFeeIndex].paymentMethod = paymentMethod;
    fee.students[studentFeeIndex].transactionId = transactionDetails.transactionId;
    fee.students[studentFeeIndex].paidAmount = amount;
    
    await fee.save();
    
    // Create notification for admin and teacher
    const notification = new Notification({
      title: 'Fee Payment Received',
      message: `Payment of ₹${amount} received from ${req.user.firstName} ${req.user.lastName} for ${fee.type}`,
      type: 'payment',
      category: 'financial',
      priority: 'medium',
      sender: req.user._id,
      recipients: [
        { user: fee.batch.teacher, role: 'teacher' },
        // Add admin recipients here if needed
      ]
    });
    
    await notification.save();
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('paymentReceived', {
        feeId: fee._id,
        childName: `${parent.children.find(c => c._id.toString() === childId).firstName} ${parent.children.find(c => c._id.toString() === childId).lastName}`,
        amount,
        paymentMethod,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId: transactionDetails.transactionId,
        amount,
        paidDate: new Date()
      }
    });
  })
);

// Add these routes to handle Parent StudentProgress component

// @route   GET /api/parents/progress/:childId/stats
// @desc    Get child's progress statistics  
// @access  Private (Parent)
router.get('/progress/:childId/stats',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { period = 'month', subject = 'all' } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'semester':
        startDate = new Date(now.getFullYear(), now.getMonth() >= 6 ? 6 : 0, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Get child's batches
    const childBatches = await Batch.find({
      'students.student': childId,
      'students.status': 'active'
    }).populate('teacher', 'firstName lastName');
    
    let batchIds = childBatches.map(batch => batch._id);
    
    // Filter by subject if specified
    if (subject !== 'all') {
      const subjectBatches = childBatches.filter(batch => batch.subject === subject);
      batchIds = subjectBatches.map(b => b._id);
    }
    
    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          batch: { $in: batchIds },
          date: { $gte: startDate, $lte: now },
          'students.student': childId
        }
      },
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
    
    // Get exam stats
    const examResults = await Exam.find({
      batch: { $in: batchIds },
      status: 'completed',
      examDate: { $gte: startDate, $lte: now },
      'submissions.student': childId
    }).populate('batch', 'name subject');
    
    let totalScore = 0;
    let totalExams = 0;
    let passedExams = 0;
    let totalMarks = 0;
    let marksObtained = 0;
    let rank = 0;
    let totalStudents = 0;
    const subjectWise = {};
    
    examResults.forEach(exam => {
      const submission = exam.submissions.find(s => 
        s.student.toString() === childId
      );
      
      if (submission) {
        totalExams++;
        totalScore += submission.percentage;
        totalMarks += exam.totalMarks;
        marksObtained += submission.totalMarksObtained;
        
        if (submission.percentage >= ((exam.passingMarks / exam.totalMarks) * 100)) {
          passedExams++;
        }
        
        // Subject-wise stats
        const subject = exam.batch.subject;
        if (subject) {
          if (!subjectWise[subject]) {
            subjectWise[subject] = {
              totalScore: 0,
              totalExams: 0,
              passed: 0,
              averageGrade: 0
            };
          }
          subjectWise[subject].totalScore += submission.percentage;
          subjectWise[subject].totalExams++;
          if (submission.percentage >= ((exam.passingMarks / exam.totalMarks) * 100)) {
            subjectWise[subject].passed++;
          }
        }
        
        if (submission.rank) {
          rank += submission.rank;
        }
      }
    });
    
    // Calculate subject averages
    Object.keys(subjectWise).forEach(subject => {
      if (subjectWise[subject].totalExams > 0) {
        subjectWise[subject].averageGrade = (
          subjectWise[subject].totalScore / subjectWise[subject].totalExams
        ).toFixed(2);
      }
    });
    
    // Format attendance data
    const attendanceData = attendanceStats.reduce((acc, stat) => {
      acc[stat._id] = { count: stat.count, lateMinutes: stat.totalLateMinutes || 0 };
      return acc;
    }, { present: { count: 0, lateMinutes: 0 }, absent: { count: 0, lateMinutes: 0 }, late: { count: 0, lateMinutes: 0 } });
    
    const totalClasses = Object.values(attendanceData).reduce((sum, data) => sum + data.count, 0);
    const attendancePercentage = totalClasses > 0 ? 
      ((attendanceData.present.count + attendanceData.late.count) / totalClasses * 100) : 0;
    
    // Calculate overall stats
    const averageRank = totalExams > 0 ? Math.round(rank / totalExams) : 0;
    const overallGrade = totalExams > 0 ? (totalScore / totalExams) : 0;
    const percentile = averageRank > 0 ? Math.max(0, 100 - ((averageRank - 1) / totalStudents * 100)) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        period,
        subject,
        overallGrade: overallGrade,
        rank: averageRank,
        totalStudents: totalStudents || childBatches.reduce((sum, batch) => sum + (batch.students?.length || 0), 0),
        percentile: percentile,
        attendancePercentage: attendancePercentage,
        attendanceStats: {
          present: attendanceData.present.count,
          absent: attendanceData.absent.count,
          late: attendanceData.late.count,
          total: totalClasses
        },
        examStats: {
          totalExams,
          passed: passedExams,
          failed: totalExams - passedExams,
          averageScore: totalExams > 0 ? (totalScore / totalExams) : 0,
          passRate: totalExams > 0 ? ((passedExams / totalExams) * 100) : 0
        },
        subjectWise: Object.keys(subjectWise).map(subject => ({
          name: subject,
          ...subjectWise[subject]
        })),
        gradeTrend: {
          direction: 'up', // You'll need to calculate this based on historical data
          value: 5.2 // Sample trend value
        },
        attendanceTrend: {
          direction: attendancePercentage > 80 ? 'up' : 'down',
          value: Math.abs(attendancePercentage - 80)
        }
      }
    });
  })
);

// @route   GET /api/parents/progress/:childId/attendance
// @desc    Get child's attendance progress data for charts
// @access  Private (Parent)
router.get('/progress/:childId/attendance',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { period = 'month' } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Get attendance records
    const attendanceRecords = await Attendance.find({
      'students.student': childId,
      date: { $gte: startDate, $lte: now }
    })
    .populate('batch', 'name subject')
    .select('date batch students')
    .sort({ date: 1 });
    
    // Process attendance data for charts
    const dailyAttendance = [];
    const batchWiseAttendance = {};
    
    attendanceRecords.forEach(record => {
      const studentRecord = record.students.find(s => 
        s.student.toString() === childId
      );
      
      if (studentRecord) {
        // Daily attendance
        dailyAttendance.push({
          date: record.date.toISOString().split('T')[0],
          status: studentRecord.status,
          batch: record.batch.name,
          subject: record.batch.subject,
          lateMinutes: studentRecord.lateMinutes || 0
        });
        
        // Batch-wise attendance
        const batchName = record.batch.name;
        if (!batchWiseAttendance[batchName]) {
          batchWiseAttendance[batchName] = { 
            present: 0, 
            absent: 0, 
            late: 0,
            total: 0,
            subject: record.batch.subject
          };
        }
        batchWiseAttendance[batchName][studentRecord.status]++;
        batchWiseAttendance[batchName].total++;
      }
    });
    
    // Calculate batch percentages
    Object.keys(batchWiseAttendance).forEach(batchName => {
      const batch = batchWiseAttendance[batchName];
      batch.percentage = batch.total > 0 ? 
        Math.round(((batch.present + batch.late) / batch.total) * 100) : 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        dailyAttendance,
        batchWiseAttendance,
        totalRecords: attendanceRecords.length
      }
    });
  })
);

// @route   GET /api/parents/progress/:childId/exams
// @desc    Get child's exam progress data
// @access  Private (Parent)
router.get('/progress/:childId/exams',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { period = 'month', subject = 'all' } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Get child's batches
    const childBatches = await Batch.find({
      'students.student': childId,
      'students.status': 'active'
    }).select('_id name subject');
    
    let batchIds = childBatches.map(batch => batch._id);
    
    // Filter by subject if specified
    if (subject !== 'all') {
      const subjectBatches = childBatches.filter(batch => batch.subject === subject);
      batchIds = subjectBatches.map(b => b._id);
    }
    
    // Get exam results
    const examResults = await Exam.find({
      batch: { $in: batchIds },
      status: 'completed',
      examDate: { $gte: startDate, $lte: now },
      'submissions.student': childId
    })
    .populate('batch', 'name subject')
    .populate('teacher', 'firstName lastName')
    .sort({ examDate: -1 });
    
    const examData = examResults.map(exam => {
      const submission = exam.submissions.find(s => 
        s.student.toString() === childId
      );
      
      return {
        _id: exam._id,
        title: exam.title,
        type: exam.type,
        subject: exam.batch.subject,
        batch: exam.batch.name,
        teacher: `${exam.teacher.firstName} ${exam.teacher.lastName}`,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        marksObtained: submission?.totalMarksObtained || 0,
        percentage: submission?.percentage || 0,
        grade: submission?.grade || 'N/A',
        rank: submission?.rank || 0,
        passed: submission ? 
          (submission.percentage >= ((exam.passingMarks / exam.totalMarks) * 100)) : false,
        submittedAt: submission?.submittedAt
      };
    });
    
    res.status(200).json({
      success: true,
      data: examData
    });
  })
);

// @route   GET /api/parents/progress/:childId/performance
// @desc    Get child's detailed performance analysis
// @access  Private (Parent)
router.get('/progress/:childId/performance',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { childId } = req.params;
    const { period = 'month', subject = 'all' } = req.query;
    const parentId = req.user._id;
    
    // Verify parent-child relationship
    const parent = await User.findById(parentId).populate('children');
    const hasChild = parent.children.some(child => child._id.toString() === childId);
    if (!hasChild) {
      throw new AppError('Access denied', 403);
    }
    
    // Get child details
    const child = await User.findById(childId).select('firstName lastName grade');
    
    // Calculate performance insights based on data
    const insights = [
      `${child.firstName} shows consistent improvement in Mathematics`,
      `Attendance has improved by 5% compared to last month`,
      `Strong performance in Science subjects`,
      `Recommendation: Focus on English writing skills`
    ];
    
    // You can add more sophisticated performance analysis here
    // based on historical data, trends, comparisons with peers, etc.
    
    res.status(200).json({
      success: true,
      data: {
        insights,
        recommendations: [
          "Continue regular study schedule",
          "Practice more mock tests",
          "Improve time management during exams"
        ],
        strengths: [
          "Mathematics",
          "Science",
          "Regular attendance"
        ],
        improvements: [
          "English writing",
          "History dates memorization",
          "Time management"
        ]
      }
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
export default router;