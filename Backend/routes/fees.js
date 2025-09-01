import express from 'express';
import Fee from '../models/Fee.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken, authorizeRoles, checkPermission } from '../middleware/auth.js';
import { feeValidationRules, handleValidationErrors, queryValidation } from '../middleware/validation.js';
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

// Helper function to build fee search query
const buildFeeSearchQuery = (req) => {
  const query = {};
  
  if (req.query.search) {
    // Search in student name, student ID, batch name
    query.$or = [
      { 'student.firstName': new RegExp(req.query.search, 'i') },
      { 'student.lastName': new RegExp(req.query.search, 'i') },
      { 'student.studentId': new RegExp(req.query.search, 'i') },
      { 'batch.name': new RegExp(req.query.search, 'i') },
      { 'batch.code': new RegExp(req.query.search, 'i') }
    ];
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.feeType) {
    query.feeType = req.query.feeType;
  }
  
  if (req.query.student) {
    query.student = req.query.student;
  }
  
  if (req.query.batch) {
    query.batch = req.query.batch;
  }
  
  if (req.query.isOverdue === 'true') {
    query.dueDate = { $lt: new Date() };
    query.status = { $in: ['pending', 'partial'] };
  }
  
  // Add date range if specified
  const dateQuery = buildDateQuery(req);
  if (dateQuery) {
    if (req.query.dateField === 'dueDate') {
      query.dueDate = dateQuery;
    } else {
      query.createdAt = dateQuery;
    }
  }
  
  return query;
};

// @route   GET /api/fees
// @desc    Get all fees with filtering and pagination
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    let query = buildFeeSearchQuery(req);
    
    // Role-based filtering
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      if (parent.children.length > 0) {
        const childrenIds = parent.children.map(child => child._id);
        query.student = { $in: childrenIds };
      } else {
        return res.status(200).json({
          success: true,
          data: {
            fees: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalFees: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can view fees for their batches
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
      sortOptions.dueDate = -1; // Default sort by due date
    }
    
    // Execute queries in parallel
    const [fees, totalFees] = await Promise.all([
      Fee.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('student', 'firstName lastName studentId email phone grade')
        .populate('batch', 'name code subject grade')
        .populate('generatedBy', 'firstName lastName')
        .populate('payments.receivedBy', 'firstName lastName')
        .lean(),
      Fee.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalFees / limit);
    
    res.status(200).json({
      success: true,
      data: {
        fees,
        pagination: {
          currentPage: page,
          totalPages,
          totalFees,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/fees/stats
// @desc    Get fee collection statistics
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
      if (req.query.dateField === 'dueDate') {
        matchStage.dueDate = dateQuery;
      } else {
        matchStage.createdAt = dateQuery;
      }
    }
    
    // Get overall statistics
    const overallStats = await Fee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalFees: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCollected: { $sum: '$paidAmount' },
          totalPending: { $sum: '$balanceAmount' },
          paidFees: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingFees: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'partial']] }, 1, 0] }
          },
          overdueFees: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $in: ['$status', ['pending', 'partial']] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                }, 
                1, 
                0
              ] 
            }
          }
        }
      }
    ]);
    
    // Get fee type wise statistics
    const feeTypeStats = await Fee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$feeType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          collectedAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Get batch wise statistics
    const batchStats = await Fee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$batch',
          totalFees: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          collectedAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$balanceAmount' }
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: '_id',
          as: 'batch',
          pipeline: [{ $project: { name: 1, code: 1, subject: 1, grade: 1 } }]
        }
      },
      { $unwind: '$batch' },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);
    
    // Get payment method statistics
    const paymentStats = await Fee.aggregate([
      { $match: matchStage },
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$payments.amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Get monthly collection data for charts
    const monthlyStats = await Fee.aggregate([
      { $unwind: '$payments' },
      {
        $match: {
          'payments.paymentDate': dateQuery || { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$payments.paymentDate' },
            month: { $month: '$payments.paymentDate' }
          },
          totalCollected: { $sum: '$payments.amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalFees: 0,
          totalAmount: 0,
          totalCollected: 0,
          totalPending: 0,
          paidFees: 0,
          pendingFees: 0,
          overdueFees: 0
        },
        feeTypeStats,
        batchStats,
        paymentStats,
        monthlyStats
      }
    });
  })
);

// @route   GET /api/fees/overdue
// @desc    Get overdue fees
// @access  Private (Admin only)
router.get('/overdue',
  authenticateToken,
  authorizeRoles('admin'),
  queryValidation.pagination,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    
    const [overdueFees, totalOverdue] = await Promise.all([
      Fee.findOverdueFees()
        .skip(skip)
        .limit(limit)
        .populate('student', 'firstName lastName studentId email phone parentId')
        .populate('batch', 'name code subject grade')
        .lean(),
      Fee.countDocuments({
        status: { $in: ['pending', 'partial'] },
        dueDate: { $lt: new Date() }
      })
    ]);
    
    const totalPages = Math.ceil(totalOverdue / limit);
    
    res.status(200).json({
      success: true,
      data: {
        overdueFees,
        pagination: {
          currentPage: page,
          totalPages,
          totalOverdue,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/fees/:id
// @desc    Get fee by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName studentId email phone grade parentId')
      .populate('batch', 'name code subject grade teacher')
      .populate('generatedBy', 'firstName lastName email')
      .populate('payments.receivedBy', 'firstName lastName email')
      .populate('discounts.appliedBy', 'firstName lastName')
      .populate('penalties.appliedBy', 'firstName lastName')
      .populate({
        path: 'student',
        populate: {
          path: 'parentId',
          select: 'firstName lastName email phone'
        }
      });
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    // Check access permissions
    if (req.user.role === 'student') {
      if (!fee.student._id.equals(req.user._id)) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const childrenIds = parent.children.map(child => child._id.toString());
      if (!childrenIds.includes(fee.student._id.toString())) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'teacher') {
      const batch = await Batch.findById(fee.batch._id);
      if (!batch.teacher.equals(req.user._id) && 
          !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
        throw new AppError('Access denied', 403);
      }
    }
    
    res.status(200).json({
      success: true,
      data: { fee }
    });
  })
);

// @route   POST /api/fees
// @desc    Create new fee record
// @access  Private (Admin only)
router.post('/',
  authenticateToken,
  authorizeRoles('admin'),
  feeValidationRules.create,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const feeData = req.body;
    
    // Verify student exists and is active
    const student = await User.findById(feeData.student);
    if (!student || student.role !== 'student' || student.status !== 'active') {
      throw new AppError('Invalid or inactive student', 400);
    }
    
    // Verify batch exists and student is enrolled
    const batch = await Batch.findById(feeData.batch)
      .populate('students.student', '_id');
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    const isEnrolled = batch.students.some(s => 
      s.student._id.equals(feeData.student) && s.status === 'active'
    );
    if (!isEnrolled) {
      throw new AppError('Student is not enrolled in this batch', 400);
    }
    
    // Check for duplicate fee (same type, month, year for same student and batch)
    if (feeData.forMonth && feeData.forYear) {
      const existingFee = await Fee.findOne({
        student: feeData.student,
        batch: feeData.batch,
        feeType: feeData.feeType,
        forMonth: feeData.forMonth,
        forYear: feeData.forYear,
        status: { $ne: 'cancelled' }
      });
      
      if (existingFee) {
        throw new AppError('Fee for this period already exists', 400);
      }
    }
    
    // Create fee
    const fee = new Fee({
      ...feeData,
      generatedBy: req.user._id,
      balanceAmount: feeData.amount
    });
    
    await fee.save();
    
    // Populate the created fee
    await fee.populate([
      { path: 'student', select: 'firstName lastName studentId email phone parentId' },
      { path: 'batch', select: 'name code subject grade' },
      { path: 'generatedBy', select: 'firstName lastName email' }
    ]);
    
    // Send notification to student and parent
    try {
      const recipients = [
        { user: fee.student._id, role: 'student' }
      ];
      
      if (fee.student.parentId) {
        recipients.push({ user: fee.student.parentId, role: 'parent' });
      }
      
      const notification = new Notification({
        title: 'New Fee Generated',
        message: `A new ${fee.feeType} fee of ₹${fee.amount} has been generated for ${fee.batch.name}. Due date: ${fee.dueDate.toLocaleDateString()}`,
        type: 'fee_reminder',
        category: 'financial',
        priority: 'medium',
        sender: req.user._id,
        recipients
      });
      
      await notification.save();
      
      // Send email notification
      await sendEmail({
        to: fee.student.email,
        subject: 'New Fee Generated - CoachingPro',
        template: 'feeGenerated',
        data: {
          studentName: fee.student.firstName + ' ' + fee.student.lastName,
          feeType: fee.feeType,
          amount: fee.amount,
          batchName: fee.batch.name,
          dueDate: fee.dueDate.toLocaleDateString(),
          paymentUrl: `${process.env.CLIENT_URL}/student/fees/${fee._id}`
        }
      });
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        recipients.forEach(recipient => {
          io.to(recipient.user.toString()).emit('feeGenerated', {
            feeId: fee._id,
            feeType: fee.feeType,
            amount: fee.amount,
            batchName: fee.batch.name,
            dueDate: fee.dueDate,
            timestamp: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Failed to send fee generation notifications:', error);
    }
    
    res.status(201).json({
      success: true,
      message: 'Fee created successfully',
      data: { fee }
    });
  })
);

// @route   POST /api/fees/:id/payment
// @desc    Record fee payment
// @access  Private (Admin only)
router.post('/:id/payment',
  authenticateToken,
  authorizeRoles('admin'),
  feeValidationRules.payment,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const paymentData = req.body;
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName email parentId')
      .populate('batch', 'name code');
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    if (fee.status === 'paid') {
      throw new AppError('Fee is already fully paid', 400);
    }
    
    if (fee.status === 'cancelled') {
      throw new AppError('Cannot add payment to cancelled fee', 400);
    }
    
    // Validate payment amount
    if (paymentData.amount > fee.balanceAmount) {
      throw new AppError('Payment amount cannot exceed balance amount', 400);
    }
    
    // Add payment using model method
    await fee.addPayment(paymentData, req.user._id);
    
    // Generate receipt number
    const receiptNumber = fee.generateReceipt();
    const lastPayment = fee.payments[fee.payments.length - 1];
    lastPayment.receipt = { number: receiptNumber };
    await fee.save();
    
    // Populate updated fee
    await fee.populate([
      { path: 'payments.receivedBy', select: 'firstName lastName' }
    ]);
    
    // Send notifications
    try {
      const recipients = [
        { user: fee.student._id, role: 'student' }
      ];
      
      if (fee.student.parentId) {
        recipients.push({ user: fee.student.parentId, role: 'parent' });
      }
      
      const isFullPayment = fee.status === 'paid';
      const notification = new Notification({
        title: isFullPayment ? 'Fee Payment Received' : 'Partial Fee Payment Received',
        message: `Payment of ₹${paymentData.amount} received for ${fee.batch.name}. ${isFullPayment ? 'Fee fully paid.' : `Balance: ₹${fee.balanceAmount}`}`,
        type: 'fee_payment',
        category: 'financial',
        priority: 'medium',
        sender: req.user._id,
        recipients
      });
      
      await notification.save();
      
      // Send email receipt
      await sendEmail({
        to: fee.student.email,
        subject: 'Payment Receipt - CoachingPro',
        template: 'paymentReceipt',
        data: {
          receiptNumber,
          studentName: fee.student.firstName + ' ' + fee.student.lastName,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          batchName: fee.batch.name,
          feeType: fee.feeType,
          paymentDate: new Date().toLocaleDateString(),
          balanceAmount: fee.balanceAmount
        }
      });
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        recipients.forEach(recipient => {
          io.to(recipient.user.toString()).emit('paymentReceived', {
            feeId: fee._id,
            amount: paymentData.amount,
            balanceAmount: fee.balanceAmount,
            status: fee.status,
            receiptNumber,
            timestamp: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Failed to send payment notifications:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        fee,
        payment: lastPayment,
        receiptNumber
      }
    });
  })
);

// @route   POST /api/fees/:id/discount
// @desc    Apply discount to fee
// @access  Private (Admin only)
router.post('/:id/discount',
  authenticateToken,
  authorizeRoles('admin'),
  feeValidationRules.discount,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const discountData = req.body;
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName')
      .populate('batch', 'name');
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    if (fee.status === 'paid') {
      throw new AppError('Cannot apply discount to fully paid fee', 400);
    }
    
    if (fee.status === 'cancelled') {
      throw new AppError('Cannot apply discount to cancelled fee', 400);
    }
    
    // Validate discount amount/percentage
    if (discountData.type === 'percentage') {
      if (!discountData.percentage || discountData.percentage <= 0 || discountData.percentage > 100) {
        throw new AppError('Invalid discount percentage', 400);
      }
    } else if (discountData.type === 'fixed') {
      if (!discountData.amount || discountData.amount <= 0) {
        throw new AppError('Invalid discount amount', 400);
      }
      if (discountData.amount > fee.amount) {
        throw new AppError('Discount amount cannot exceed fee amount', 400);
      }
    }
    
    // Apply discount using model method
    await fee.addDiscount(discountData, req.user._id);
    
    // Send notification
    try {
      const recipients = [
        { user: fee.student._id, role: 'student' }
      ];
      
      if (fee.student.parentId) {
        recipients.push({ user: fee.student.parentId, role: 'parent' });
      }
      
      const notification = new Notification({
        title: 'Discount Applied',
        message: `A discount of ${discountData.type === 'percentage' ? `${discountData.percentage}%` : `₹${discountData.amount}`} has been applied to your ${fee.batch.name} fee. ${discountData.reason ? `Reason: ${discountData.reason}` : ''}`,
        type: 'fee_reminder',
        category: 'financial',
        priority: 'medium',
        sender: req.user._id,
        recipients
      });
      
      await notification.save();
    } catch (error) {
      console.error('Failed to send discount notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Discount applied successfully',
      data: { fee }
    });
  })
);

// @route   POST /api/fees/:id/penalty
// @desc    Apply penalty to fee
// @access  Private (Admin only)
router.post('/:id/penalty',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { type, amount, reason } = req.body;
    
    if (!['late_fee', 'bounced_cheque', 'other'].includes(type)) {
      throw new AppError('Invalid penalty type', 400);
    }
    
    if (!amount || amount <= 0) {
      throw new AppError('Invalid penalty amount', 400);
    }
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName parentId')
      .populate('batch', 'name');
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    if (fee.status === 'cancelled') {
      throw new AppError('Cannot apply penalty to cancelled fee', 400);
    }
    
    // Apply penalty using model method
    await fee.addPenalty({ type, amount, reason }, req.user._id);
    
    // Send notification
    try {
      const recipients = [
        { user: fee.student._id, role: 'student' }
      ];
      
      if (fee.student.parentId) {
        recipients.push({ user: fee.student.parentId, role: 'parent' });
      }
      
      const notification = new Notification({
        title: 'Penalty Applied',
        message: `A penalty of ₹${amount} has been applied to your ${fee.batch.name} fee. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'fee_reminder',
        category: 'financial',
        priority: 'high',
        sender: req.user._id,
        recipients
      });
      
      await notification.save();
    } catch (error) {
      console.error('Failed to send penalty notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Penalty applied successfully',
      data: { fee }
    });
  })
);

// @route   PUT /api/fees/:id/status
// @desc    Update fee status
// @access  Private (Admin only)
router.put('/:id/status',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName parentId')
      .populate('batch', 'name');
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    const oldStatus = fee.status;
    fee.status = status;
    fee.lastUpdatedBy = req.user._id;
    
    if (status === 'cancelled' && reason) {
      fee.notes = (fee.notes || '') + `\nCancelled: ${reason}`;
    }
    
    await fee.save();
    
    // Send notification for status change
    if (oldStatus !== status) {
      try {
        const recipients = [
          { user: fee.student._id, role: 'student' }
        ];
        
        if (fee.student.parentId) {
          recipients.push({ user: fee.student.parentId, role: 'parent' });
        }
        
        const notification = new Notification({
          title: 'Fee Status Updated',
          message: `Your ${fee.batch.name} fee status has been changed from ${oldStatus} to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
          type: 'fee_reminder',
          category: 'financial',
          priority: status === 'cancelled' ? 'high' : 'medium',
          sender: req.user._id,
          recipients
        });
        
        await notification.save();
      } catch (error) {
        console.error('Failed to send status change notification:', error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Fee status updated to ${status}`,
      data: { fee }
    });
  })
);

// @route   POST /api/fees/:id/reminder
// @desc    Send fee reminder
// @access  Private (Admin only)
router.post('/:id/reminder',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { type = 'email' } = req.body;
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName email phone parentId')
      .populate('batch', 'name code')
      .populate({
        path: 'student',
        populate: {
          path: 'parentId',
          select: 'firstName lastName email phone'
        }
      });
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    if (fee.status === 'paid') {
      throw new AppError('Cannot send reminder for paid fee', 400);
    }
    
    if (fee.status === 'cancelled') {
      throw new AppError('Cannot send reminder for cancelled fee', 400);
    }
    
    // Send email reminder
    try {
      const isOverdue = fee.isOverdue;
      const daysOverdue = fee.daysOverdue;
      
      await sendEmail({
        to: fee.student.email,
        subject: `${isOverdue ? 'Overdue' : 'Pending'} Fee Reminder - CoachingPro`,
        template: 'feeReminder',
        data: {
          studentName: fee.student.firstName + ' ' + fee.student.lastName,
          feeType: fee.feeType,
          amount: fee.balanceAmount,
          batchName: fee.batch.name,
          dueDate: fee.dueDate.toLocaleDateString(),
          isOverdue,
          daysOverdue,
          paymentUrl: `${process.env.CLIENT_URL}/student/fees/${fee._id}`
        }
      });
      
      // Send to parent as well if exists
      if (fee.student.parentId) {
        await sendEmail({
          to: fee.student.parentId.email,
          subject: `${isOverdue ? 'Overdue' : 'Pending'} Fee Reminder for ${fee.student.firstName} - CoachingPro`,
          template: 'parentFeeReminder',
          data: {
            parentName: fee.student.parentId.firstName + ' ' + fee.student.parentId.lastName,
            studentName: fee.student.firstName + ' ' + fee.student.lastName,
            feeType: fee.feeType,
            amount: fee.balanceAmount,
            batchName: fee.batch.name,
            dueDate: fee.dueDate.toLocaleDateString(),
            isOverdue,
            daysOverdue
          }
        });
      }
      
      // Record reminder
      await fee.sendReminder(type, fee.student.email);
      
      // Send real-time notification
      const recipients = [
        { user: fee.student._id, role: 'student' }
      ];
      
      if (fee.student.parentId) {
        recipients.push({ user: fee.student.parentId._id, role: 'parent' });
      }
      
      const notification = new Notification({
        title: `${isOverdue ? 'Overdue' : 'Pending'} Fee Reminder`,
        message: `Reminder: Your ${fee.feeType} fee of ₹${fee.balanceAmount} for ${fee.batch.name} is ${isOverdue ? `overdue by ${daysOverdue} days` : `due on ${fee.dueDate.toLocaleDateString()}`}`,
        type: 'fee_reminder',
        category: 'financial',
        priority: isOverdue ? 'high' : 'medium',
        sender: req.user._id,
        recipients
      });
      
      await notification.save();
      
      const io = req.app.get('io');
      if (io) {
        recipients.forEach(recipient => {
          io.to(recipient.user.toString()).emit('feeReminder', {
            feeId: fee._id,
            amount: fee.balanceAmount,
            dueDate: fee.dueDate,
            isOverdue,
            daysOverdue,
            timestamp: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Failed to send fee reminder:', error);
      throw new AppError('Failed to send reminder', 500);
    }
    
    res.status(200).json({
      success: true,
      message: 'Fee reminder sent successfully'
    });
  })
);

// @route   GET /api/fees/student/:studentId
// @desc    Get student's fee history
// @access  Private (Admin, Teacher, Student themselves, Parent)
router.get('/student/:studentId',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { studentId } = req.params;
    
    // Check permissions
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      throw new AppError('Access denied', 403);
    }
    
    if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const hasChild = parent.children.some(child => child._id.toString() === studentId);
      if (!hasChild) {
        throw new AppError('Access denied', 403);
      }
    }
    
    const { page, limit, skip } = getPaginationOptions(req);
    
    let query = { student: studentId };
    
    // Add date range if specified
    const dateQuery = buildDateQuery(req);
    if (dateQuery) {
      if (req.query.dateField === 'dueDate') {
        query.dueDate = dateQuery;
      } else {
        query.createdAt = dateQuery;
      }
    }
    
    // Add status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const [fees, totalFees] = await Promise.all([
      Fee.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('batch', 'name code subject grade')
        .populate('payments.receivedBy', 'firstName lastName')
        .lean(),
      Fee.countDocuments(query)
    ]);
    
    // Get student fee statistics
    const stats = await Fee.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$balanceAmount' },
          overdueFees: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['pending', 'partial']] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    const totalPages = Math.ceil(totalFees / limit);
    
    res.status(200).json({
      success: true,
      data: {
        studentId,
        fees,
        statistics: stats[0] || {
          totalFees: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueFees: 0
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalFees,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   DELETE /api/fees/:id
// @desc    Delete fee record (Admin only)
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const fee = await Fee.findById(id)
      .populate('student', 'firstName lastName')
      .populate('batch', 'name');
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    // Check if fee has payments
    if (fee.payments.length > 0) {
      throw new AppError('Cannot delete fee with payment history. Cancel instead.', 400);
    }
    
    await Fee.findByIdAndDelete(id);
    
    // Send notification
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('feeDeleted', {
          feeId: id,
          studentName: fee.student.firstName + ' ' + fee.student.lastName,
          batchName: fee.batch.name,
          feeType: fee.feeType,
          amount: fee.amount,
          deletedBy: req.user.firstName + ' ' + req.user.lastName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send fee deletion notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  })
);

// Cron job to check for overdue fees and send automatic reminders
if (process.env.ENABLE_OVERDUE_REMINDERS === 'true') {
  cron.schedule('0 9 * * *', async () => { // Daily at 9 AM
    try {
      console.log('🔔 Running overdue fee reminder check...');
      
      const overdueFees = await Fee.findOverdueFees()
        .populate('student', 'firstName lastName email parentId')
        .populate('batch', 'name')
        .populate({
          path: 'student',
          populate: {
            path: 'parentId',
            select: 'firstName lastName email'
          }
        });
      
      for (const fee of overdueFees) {
        // Check if reminder was sent in last 3 days
        const lastReminder = fee.remindersSent
          .filter(r => r.type === 'email')
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))[0];
        
        const shouldSendReminder = !lastReminder || 
          (new Date() - new Date(lastReminder.sentAt)) > (3 * 24 * 60 * 60 * 1000);
        
        if (shouldSendReminder) {
          try {
            await sendEmail({
              to: fee.student.email,
              subject: 'Overdue Fee Reminder - CoachingPro',
              template: 'overdueReminder',
              data: {
                studentName: fee.student.firstName + ' ' + fee.student.lastName,
                feeType: fee.feeType,
                amount: fee.balanceAmount,
                batchName: fee.batch.name,
                daysOverdue: fee.daysOverdue,
                dueDate: fee.dueDate.toLocaleDateString()
              }
            });
            
            await fee.sendReminder('email', fee.student.email);
            console.log(`📧 Sent overdue reminder to ${fee.student.firstName} ${fee.student.lastName}`);
          } catch (error) {
            console.error(`Failed to send overdue reminder to ${fee.student.firstName}:`, error);
          }
        }
      }
      
      console.log(`✅ Processed ${overdueFees.length} overdue fees`);
    } catch (error) {
      console.error('❌ Error in overdue reminder cron job:', error);
    }
  });
}
// Add these routes before the export statement

// @route   GET /api/fees/teacher-view
// @desc    Get fee records for teacher's batches
// @access  Private (Teacher)
router.get('/teacher-view',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, batchId, status, search } = req.query;
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
      matchQuery['students.status'] = status;
    }
    
    const fees = await Fee.find(matchQuery)
      .populate('batch', 'name code')
      .populate('students.student', 'firstName lastName email studentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter by search if provided
    let filteredFees = fees;
    if (search) {
      filteredFees = fees.filter(fee => 
        fee.batch.name.toLowerCase().includes(search.toLowerCase()) ||
        fee.type.toLowerCase().includes(search.toLowerCase()) ||
        fee.students.some(s => 
          s.student.firstName.toLowerCase().includes(search.toLowerCase()) ||
          s.student.lastName.toLowerCase().includes(search.toLowerCase()) ||
          s.student.studentId.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    
    const total = await Fee.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: {
        fees: filteredFees,
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

// @route   GET /api/fees/teacher-stats
// @desc    Get fee statistics for teacher's batches
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
    
    // Get fee statistics
    const stats = await Fee.aggregate([
      {
        $match: { batch: { $in: batchIds } }
      },
      {
        $unwind: '$students'
      },
      {
        $group: {
          _id: '$students.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$students.amount' }
        }
      }
    ]);
    
    // Format stats
    const formattedStats = {
      total: 0,
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 }
    };
    
    stats.forEach(stat => {
      formattedStats.total += stat.count;
      if (formattedStats[stat._id]) {
        formattedStats[stat._id] = {
          count: stat.count,
          amount: stat.totalAmount
        };
      }
    });
    
    // Get monthly collection data
    const currentYear = new Date().getFullYear();
    const monthlyData = await Fee.aggregate([
      {
        $match: {
          batch: { $in: batchIds },
          'students.paidDate': {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $unwind: '$students'
      },
      {
        $match: {
          'students.status': 'paid',
          'students.paidDate': {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$students.paidDate' },
          amount: { $sum: '$students.amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        ...formattedStats,
        monthlyCollection: monthlyData
      }
    });
  })
);

// @route   GET /api/fees/:id/payments
// @desc    Get payment history for a fee record
// @access  Private (Teacher, Admin)
router.get('/:id/payments',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const fee = await Fee.findById(id)
      .populate('batch', 'name code')
      .populate('students.student', 'firstName lastName email studentId');
    
    if (!fee) {
      throw new AppError('Fee record not found', 404);
    }
    
    // For teachers, check if they have access to this batch
    if (req.user.role === 'teacher') {
      const batch = await Batch.findById(fee.batch._id);
      if (!batch || (batch.teacher.toString() !== req.user._id.toString() && 
          !batch.assistantTeachers.includes(req.user._id))) {
        throw new AppError('Access denied', 403);
      }
    }
    
    // Format payment history
    const paymentHistory = fee.students
      .filter(s => s.status === 'paid' && s.paidDate)
      .map(s => ({
        studentId: s.student._id,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        studentCode: s.student.studentId,
        amount: s.amount,
        paidDate: s.paidDate,
        paymentMethod: s.paymentMethod,
        transactionId: s.transactionId,
        remarks: s.remarks
      }))
      .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    
    res.status(200).json({
      success: true,
      data: paymentHistory
    });
  })
);
// Add to backend/routes/parents.js

// @route   POST /api/parents/payments/process
// @desc    Process fee payment for child
// @access  Private (Parent)
router.post('/payments/process',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const { feeId, paymentMethod, paymentDetails } = req.body;
    const parentId = req.user._id;
    
    // Find the fee
    const fee = await Fee.findById(feeId)
      .populate('student', 'firstName lastName parentId');
    
    if (!fee) {
      throw new AppError('Fee not found', 404);
    }
    
    // Verify parent owns this child
    if (!fee.student.parentId.equals(parentId)) {
      throw new AppError('Access denied', 403);
    }
    
    // Process payment logic here
    // This would integrate with your payment gateway (Stripe, Razorpay, etc.)
    
    // For now, we'll simulate a successful payment
    fee.status = 'paid';
    fee.paidAmount = fee.amount;
    fee.paidDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.paymentDetails = paymentDetails;
    fee.paidBy = parentId;
    
    await fee.save();
    
    // Create notification
    const notification = new Notification({
      title: 'Payment Successful',
      message: `Payment of ₹${fee.amount} for ${fee.student.firstName} ${fee.student.lastName} has been processed successfully`,
      type: 'payment_success',
      category: 'financial',
      priority: 'medium',
      sender: parentId,
      recipients: [{ user: parentId, role: 'parent' }]
    });
    
    await notification.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(parentId.toString()).emit('paymentProcessed', {
        feeId: fee._id,
        amount: fee.amount,
        studentName: `${fee.student.firstName} ${fee.student.lastName}`,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId: `TXN${Date.now()}`, // Generate proper transaction ID
        amount: fee.amount,
        status: 'success'
      }
    });
  })
);
export default router;