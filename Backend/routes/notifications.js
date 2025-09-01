import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import { authenticateToken, authorizeRoles, checkPermission } from '../middleware/auth.js';
import { notificationValidationRules, handleValidationErrors, queryValidation } from '../middleware/validation.js';
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

// Helper function to build notification search query
const buildNotificationSearchQuery = (req) => {
  const query = {};
  
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { title: searchRegex },
      { message: searchRegex },
      { type: searchRegex },
      { category: searchRegex }
    ];
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.priority) {
    query.priority = req.query.priority;
  }
  
  if (req.query.isRead !== undefined) {
    query['recipients.isRead'] = req.query.isRead === 'true';
  }
  
  if (req.query.sender) {
    query.sender = req.query.sender;
  }
  
  // Add date range if specified
  const dateQuery = buildDateQuery(req);
  if (dateQuery) {
    if (req.query.dateField === 'scheduleDate') {
      query.scheduleDate = dateQuery;
    } else {
      query.createdAt = dateQuery;
    }
  }
  
  return query;
};

// @route   GET /api/notifications
// @desc    Get notifications with filtering and pagination
// @access  Private (All roles)
router.get('/',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    let query = buildNotificationSearchQuery(req);
    
    // Role-based filtering
    if (req.user.role !== 'admin') {
      // Non-admin users can only see notifications they are recipients of
      query['recipients.user'] = req.user._id;
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
      sortOptions.createdAt = -1; // Default sort by creation date
    }
    
    // Execute queries in parallel
    const [notifications, totalNotifications] = await Promise.all([
      Notification.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('sender', 'firstName lastName email role')
        .populate('recipients.user', 'firstName lastName email role')
        .populate('approvedBy', 'firstName lastName')
        .lean(),
      Notification.countDocuments(query)
    ]);
    
    // Filter recipient data for non-admin users
    if (req.user.role !== 'admin') {
      notifications.forEach(notification => {
        notification.recipients = notification.recipients.filter(r => 
          r.user._id.toString() === req.user._id.toString()
        );
      });
    }
    
    const totalPages = Math.ceil(totalNotifications / limit);
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/notifications/unread
// @desc    Get unread notifications for current user
// @access  Private (All roles)
router.get('/unread',
  authenticateToken,
  queryValidation.pagination,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    
    const query = {
      'recipients.user': req.user._id,
      'recipients.isRead': false,
      status: 'sent'
    };
    
    const [unreadNotifications, totalUnread] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'firstName lastName email role')
        .lean(),
      Notification.countDocuments(query)
    ]);
    
    // Filter recipient data to show only current user
    unreadNotifications.forEach(notification => {
      notification.recipients = notification.recipients.filter(r => 
        r.user.toString() === req.user._id.toString()
      );
    });
    
    const totalPages = Math.ceil(totalUnread / limit);
    
    res.status(200).json({
      success: true,
      data: {
        unreadNotifications,
        totalUnread,
        pagination: {
          currentPage: page,
          totalPages,
          totalUnread,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
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
      matchStage.createdAt = dateQuery;
    }
    
    // Get overall statistics
    const overallStats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          avgDeliveryRate: { $avg: '$deliveryStats.delivered' },
          avgReadRate: { $avg: '$deliveryStats.read' },
          totalRecipients: { $sum: '$deliveryStats.totalRecipients' },
          totalDelivered: { $sum: '$deliveryStats.delivered' },
          totalRead: { $sum: '$deliveryStats.read' },
          totalFailed: { $sum: '$deliveryStats.failed' }
        }
      }
    ]);
    
    // Get type-wise statistics
    const typeStats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgReadRate: { $avg: '$readPercentage' },
          avgDeliveryRate: { $avg: '$deliveryPercentage' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get category-wise statistics
    const categoryStats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgReadRate: { $avg: '$readPercentage' },
          avgDeliveryRate: { $avg: '$deliveryPercentage' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get status-wise statistics
    const statusStats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get sender-wise statistics
    const senderStats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$sender',
          notificationCount: { $sum: 1 },
          avgReadRate: { $avg: '$readPercentage' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sender',
          pipeline: [{ $project: { firstName: 1, lastName: 1, role: 1 } }]
        }
      },
      { $unwind: '$sender' },
      { $sort: { notificationCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Get daily delivery trends
    const dailyStats = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSent: { $sum: 1 },
          totalDelivered: { $sum: '$deliveryStats.delivered' },
          totalRead: { $sum: '$deliveryStats.read' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalNotifications: 0,
          avgDeliveryRate: 0,
          avgReadRate: 0,
          totalRecipients: 0,
          totalDelivered: 0,
          totalRead: 0,
          totalFailed: 0
        },
        typeStats,
        categoryStats,
        statusStats,
        senderStats,
        dailyStats
      }
    });
  })
);

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findById(id)
      .populate('sender', 'firstName lastName email role')
      .populate('recipients.user', 'firstName lastName email role')
      .populate('approvedBy', 'firstName lastName')
      .populate('replies.user', 'firstName lastName');
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check access permissions
    if (req.user.role !== 'admin') {
      const isRecipient = notification.recipients.some(r => 
        r.user._id.equals(req.user._id)
      );
      const isSender = notification.sender._id.equals(req.user._id);
      
      if (!isRecipient && !isSender) {
        throw new AppError('Access denied', 403);
      }
      
      // Filter recipient data for non-admin users
      notification.recipients = notification.recipients.filter(r => 
        r.user._id.equals(req.user._id)
      );
    }
    
    res.status(200).json({
      success: true,
      data: { notification }
    });
  })
);

// @route   POST /api/notifications
// @desc    Create new notification
// @access  Private (Admin, Teacher)
router.post('/',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  notificationValidationRules.create,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const notificationData = req.body;
    
    // Process target audience
    let recipients = [];
    
    if (notificationData.targetAudience) {
      const { roles, batches, userIds, parentIds } = notificationData.targetAudience;
      
      // Add recipients by roles
      if (roles && roles.length > 0) {
        const usersByRole = await User.find({ 
          role: { $in: roles }, 
          status: 'active' 
        }).select('_id role');
        
        usersByRole.forEach(user => {
          recipients.push({ user: user._id, role: user.role });
        });
      }
      
      // Add recipients by batches
      if (batches && batches.length > 0) {
        const batchesData = await Batch.find({ 
          _id: { $in: batches } 
        }).populate('students.student teacher assistantTeachers', '_id role');
        
        batchesData.forEach(batch => {
          // Add teachers
          recipients.push({ user: batch.teacher._id, role: 'teacher' });
          
          // Add assistant teachers
          batch.assistantTeachers.forEach(at => {
            recipients.push({ user: at._id, role: 'teacher' });
          });
          
          // Add students
          batch.students
            .filter(s => s.status === 'active')
            .forEach(s => {
              recipients.push({ user: s.student._id, role: 'student' });
            });
        });
      }
      
      // Add specific users
      if (userIds && userIds.length > 0) {
        const users = await User.find({ 
          _id: { $in: userIds }, 
          status: 'active' 
        }).select('_id role');
        
        users.forEach(user => {
          recipients.push({ user: user._id, role: user.role });
        });
      }
      
      // Add parents
      if (parentIds && parentIds.length > 0) {
        parentIds.forEach(parentId => {
          recipients.push({ user: parentId, role: 'parent' });
        });
      }
    } else if (notificationData.recipients) {
      recipients = notificationData.recipients;
    }
    
    // Remove duplicates
    const uniqueRecipients = recipients.reduce((acc, current) => {
      const exists = acc.find(r => r.user.toString() === current.user.toString());
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    // Create notification
    const notification = new Notification({
      ...notificationData,
      sender: req.user._id,
      recipients: uniqueRecipients,
      status: notificationData.scheduleDate ? 'scheduled' : 'sent'
    });
    
    await notification.save();
    
    // Populate the created notification
    await notification.populate([
      { path: 'sender', select: 'firstName lastName email role' },
      { path: 'recipients.user', select: 'firstName lastName email role' }
    ]);
    
    // Send immediate notifications if not scheduled
    if (!notificationData.scheduleDate) {
      try {
        await sendNotifications(notification);
      } catch (error) {
        console.error('Failed to send immediate notifications:', error);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });
  })
);

// @route   PUT /api/notifications/:id
// @desc    Update notification (Admin, Sender)
// @access  Private (Admin, Sender before sending)
router.put('/:id',
  authenticateToken,
  notificationValidationRules.create,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && !notification.sender.equals(req.user._id)) {
      throw new AppError('Access denied', 403);
    }
    
    // Check if notification can be updated
    if (notification.status === 'sent' || notification.status === 'sending') {
      throw new AppError('Cannot update notification that has been sent', 400);
    }
    
    // Update notification
    Object.assign(notification, updateData);
    await notification.save();
    
    await notification.populate([
      { path: 'sender', select: 'firstName lastName email role' },
      { path: 'recipients.user', select: 'firstName lastName email role' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: { notification }
    });
  })
);

// @route   POST /api/notifications/:id/mark-read
// @desc    Mark notification as read
// @access  Private (Recipients only)
router.post('/:id/mark-read',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user is a recipient
    const isRecipient = notification.recipients.some(r => 
      r.user.equals(req.user._id)
    );
    
    if (!isRecipient) {
      throw new AppError('Access denied', 403);
    }
    
    // Mark as read
    await notification.markAsRead(req.user._id);
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notificationRead', {
        notificationId: notification._id,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  })
);

// @route   POST /api/notifications/:id/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private (All roles)
router.post('/mark-all-read',
  authenticateToken,
  catchAsync(async (req, res) => {
    const result = await Notification.updateMany(
      {
        'recipients.user': req.user._id,
        'recipients.isRead': false
      },
      {
        $set: {
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      }
    );
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('allNotificationsRead', {
        count: result.modifiedCount,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  })
);

// @route   POST /api/notifications/:id/reply
// @desc    Reply to notification
// @access  Private (Recipients only)
router.post('/:id/reply',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      throw new AppError('Reply message is required', 400);
    }
    
    const notification = await Notification.findById(id)
      .populate('sender', 'firstName lastName email');
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user is a recipient
    const isRecipient = notification.recipients.some(r => 
      r.user.equals(req.user._id)
    );
    
    if (!isRecipient) {
      throw new AppError('Access denied', 403);
    }
    
    // Check if replies are allowed
    if (!notification.allowReplies) {
      throw new AppError('Replies are not allowed for this notification', 400);
    }
    
    // Add reply
    await notification.addReply(req.user._id, message);
    
    // Notify sender about the reply
    try {
      const replyNotification = new Notification({
        title: 'Reply Received',
        message: `${req.user.firstName} ${req.user.lastName} replied to your notification: "${notification.title}"`,
        type: 'reply',
        category: 'administrative',
        priority: 'medium',
        sender: req.user._id,
        recipients: [{ user: notification.sender._id, role: notification.sender.role }]
      });
      
      await replyNotification.save();
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(notification.sender._id.toString()).emit('notificationReply', {
          originalNotificationId: notification._id,
          replyFrom: req.user.firstName + ' ' + req.user.lastName,
          message,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send reply notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Reply sent successfully'
    });
  })
);

// @route   POST /api/notifications/:id/send
// @desc    Send scheduled notification immediately
// @access  Private (Admin, Sender)
router.post('/:id/send',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findById(id)
      .populate('recipients.user', 'firstName lastName email phone');
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && !notification.sender.equals(req.user._id)) {
      throw new AppError('Access denied', 403);
    }
    
    // Check if notification can be sent
    if (notification.status === 'sent' || notification.status === 'sending') {
      throw new AppError('Notification already sent or sending', 400);
    }
    
    if (notification.status === 'cancelled') {
      throw new AppError('Cannot send cancelled notification', 400);
    }
    
    // Send notification
    try {
      notification.status = 'sending';
      await notification.save();
      
      await sendNotifications(notification);
      
      notification.status = 'sent';
      await notification.save();
      
      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        data: { notification }
      });
    } catch (error) {
      notification.status = 'failed';
      await notification.save();
      throw new AppError('Failed to send notification', 500);
    }
  })
);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification (Admin, Sender before sending)
// @access  Private (Admin, Sender)
router.delete('/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && !notification.sender.equals(req.user._id)) {
      throw new AppError('Access denied', 403);
    }
    
    // Check if notification can be deleted
    if (notification.status === 'sent' && req.user.role !== 'admin') {
      throw new AppError('Cannot delete sent notification', 400);
    }
    
    await Notification.findByIdAndDelete(id);
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('notificationDeleted', {
        notificationId: id,
        title: notification.title,
        deletedBy: req.user.firstName + ' ' + req.user.lastName,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  })
);

// @route   GET /api/notifications/user/:userId
// @desc    Get notifications for specific user
// @access  Private (Admin, User themselves, Parent for children)
router.get('/user/:userId',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      if (req.user.role === 'parent') {
        const parent = await User.findById(req.user._id).populate('children');
        const hasChild = parent.children.some(child => child._id.toString() === userId);
        if (!hasChild) {
          throw new AppError('Access denied', 403);
        }
      } else {
        throw new AppError('Access denied', 403);
      }
    }
    
    const { page, limit, skip } = getPaginationOptions(req);
    
    let query = {
      'recipients.user': userId,
      status: 'sent'
    };
    
    // Add filters
    if (req.query.isRead !== undefined) {
      query['recipients.isRead'] = req.query.isRead === 'true';
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    const dateQuery = buildDateQuery(req);
    if (dateQuery) {
      query.createdAt = dateQuery;
    }
    
    const [notifications, totalNotifications] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'firstName lastName email role')
        .lean(),
      Notification.countDocuments(query)
    ]);
    
    // Filter recipient data to show only the specified user
    notifications.forEach(notification => {
      notification.recipients = notification.recipients.filter(r => 
        r.user.toString() === userId
      );
    });
    
    const totalPages = Math.ceil(totalNotifications / limit);
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   POST /api/notifications/broadcast
// @desc    Broadcast notification to all active users
// @access  Private (Admin only)
router.post('/broadcast',
  authenticateToken,
  authorizeRoles('admin'),
  notificationValidationRules.create,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const notificationData = req.body;
    
    // Get all active users
    const activeUsers = await User.find({ status: 'active' })
      .select('_id role');
    
    const recipients = activeUsers.map(user => ({
      user: user._id,
      role: user.role
    }));
    
    // Create broadcast notification
    const notification = new Notification({
      ...notificationData,
      sender: req.user._id,
      recipients,
      status: 'sent'
    });
    
    await notification.save();
    
    // Send notifications
    try {
      await sendNotifications(notification);
    } catch (error) {
      console.error('Failed to send broadcast notifications:', error);
    }
    
    res.status(201).json({
      success: true,
      message: `Broadcast notification sent to ${recipients.length} users`,
      data: { notification }
    });
  })
);

// Helper function to send notifications via various channels
async function sendNotifications(notification) {
  const io = req?.app?.get('io');
  
  for (const recipient of notification.recipients) {
    try {
      // Mark as delivered
      await notification.markAsDelivered(recipient.user._id);
      
      // In-app notification (real-time)
      if (notification.channels.inApp && io) {
        io.to(recipient.user._id.toString()).emit('newNotification', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          priority: notification.priority,
          timestamp: notification.createdAt
        });
      }
      
      // Email notification
      if (notification.channels.email && recipient.user.email) {
        await sendEmail({
          to: recipient.user.email,
          subject: notification.title,
          template: 'notification',
          data: {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            recipientName: recipient.user.firstName + ' ' + recipient.user.lastName
          }
        });
      }
      
      // TODO: Add SMS, WhatsApp, and Push notification implementations
      
    } catch (error) {
      console.error(`Failed to send notification to user ${recipient.user._id}:`, error);
    }
  }
}

// Cron job to process scheduled notifications
if (process.env.ENABLE_NOTIFICATION_SCHEDULER === 'true') {
  cron.schedule('* * * * *', async () => { // Run every minute
    try {
      console.log('🔔 Processing scheduled notifications...');
      
      const pendingNotifications = await Notification.findPending();
      
      for (const notification of pendingNotifications) {
        try {
          notification.status = 'sending';
          await notification.save();
          
          await sendNotifications(notification);
          
          notification.status = 'sent';
          await notification.save();
          
          console.log(`✅ Sent scheduled notification: ${notification.title}`);
        } catch (error) {
          console.error(`❌ Failed to send scheduled notification ${notification._id}:`, error);
          notification.status = 'failed';
          await notification.save();
        }
      }
      
      if (pendingNotifications.length > 0) {
        console.log(`📨 Processed ${pendingNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      console.error('❌ Error in notification scheduler:', error);
    }
  });
}
// Add these routes before the export statement

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count for current user
// @access  Private
router.get('/unread-count',
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      $or: [
        { 'recipients.user': userId },
        { 
          targetAudience: { $in: ['all', req.user.role + 's'] }
        }
      ],
      isRead: { $nin: [userId] }
    });
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  })
);

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read for current user
// @access  Private
router.post('/mark-all-read',
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    
    await Notification.updateMany(
      {
        $or: [
          { 'recipients.user': userId },
          { 
            targetAudience: { $in: ['all', req.user.role + 's'] }
          }
        ],
        isRead: { $nin: [userId] }
      },
      {
        $addToSet: { isRead: userId }
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  })
);

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all read notifications for current user
// @access  Private
router.delete('/clear-all',
  catchAsync(async (req, res) => {
    const userId = req.user._id;
    
    await Notification.updateMany(
      {
        $or: [
          { 'recipients.user': userId },
          { 
            targetAudience: { $in: ['all', req.user.role + 's'] }
          }
        ],
        isRead: userId
      },
      {
        $addToSet: { deletedBy: userId }
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Read notifications cleared'
    });
  })
);
// Add these routes before the export statement

// @route   GET /api/notifications/teacher-stats
// @desc    Get notification statistics for teacher
// @access  Private (Teacher)
router.get('/teacher-stats',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const teacherId = req.user._id;
    
    // Get notifications sent by teacher
    const sentStats = await Notification.aggregate([
      {
        $match: { sender: teacherId }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total sent this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlySent = await Notification.countDocuments({
      sender: teacherId,
      createdAt: { $gte: monthStart }
    });
    
    // Get read rate
    const notificationsWithReads = await Notification.find({
      sender: teacherId
    }).select('recipients isRead');
    
    let totalRecipients = 0;
    let totalReads = 0;
    
    notificationsWithReads.forEach(notification => {
      const recipientCount = notification.recipients.length;
      const readCount = notification.isRead.length;
      totalRecipients += recipientCount;
      totalReads += readCount;
    });
    
    const readRate = totalRecipients > 0 ? Math.round((totalReads / totalRecipients) * 100) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalSent: sentStats.reduce((total, stat) => total + stat.count, 0),
        monthlySent,
        readRate,
        byCategory: sentStats,
        totalRecipients,
        totalReads
      }
    });
  })
);

// @route   POST /api/notifications/:id/resend
// @desc    Resend notification to unread recipients
// @access  Private (Teacher, Admin)
router.post('/:id/resend',
  authenticateToken,
  authorizeRoles('teacher', 'admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findById(id)
      .populate('recipients.user', 'firstName lastName email');
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    // Check if user has permission to resend this notification
    if (req.user.role === 'teacher' && notification.sender.toString() !== req.user._id.toString()) {
      throw new AppError('Access denied', 403);
    }
    
    // Get unread recipients
    const unreadRecipients = notification.recipients.filter(r => 
      !notification.isRead.includes(r.user._id)
    );
    
    if (unreadRecipients.length === 0) {
      throw new AppError('All recipients have already read this notification', 400);
    }
    
    // Send real-time notification to unread recipients
    const io = req.app.get('io');
    if (io) {
      unreadRecipients.forEach(recipient => {
        io.to(recipient.user._id.toString()).emit('notificationResent', {
          notificationId: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          timestamp: new Date()
        });
      });
    }
    
    // Update resent timestamp
    notification.resentAt = new Date();
    notification.resentBy = req.user._id;
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: `Notification resent to ${unreadRecipients.length} recipients`,
      data: {
        resentToCount: unreadRecipients.length,
        totalRecipients: notification.recipients.length
      }
    });
  })
);

export default router;