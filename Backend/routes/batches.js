import express from 'express';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import { authenticateToken, authorizeRoles, checkPermission } from '../middleware/auth.js';
import { batchValidationRules, handleValidationErrors, queryValidation } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Helper function for pagination
const getPaginationOptions = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

// Helper function for search and filter
const buildBatchSearchQuery = (req) => {
  const query = {};
  
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { subject: searchRegex },
      { grade: searchRegex }
    ];
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.subject) {
    query.subject = new RegExp(req.query.subject, 'i');
  }
  
  if (req.query.grade) {
    query.grade = req.query.grade;
  }
  
  if (req.query.teacher) {
    query.teacher = req.query.teacher;
  }
  
  if (req.query.level) {
    query.level = req.query.level;
  }
  
  if (req.query.startDate) {
    query.startDate = { $gte: new Date(req.query.startDate) };
  }
  
  if (req.query.endDate) {
    query.endDate = { $lte: new Date(req.query.endDate) };
  }
  
  return query;
};

// @route   GET /api/batches
// @desc    Get all batches with pagination, search, and filters
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.search,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    let searchQuery = buildBatchSearchQuery(req);
    
    // Filter based on user role
    if (req.user.role === 'teacher') {
      searchQuery.$or = [
        { teacher: req.user._id },
        { assistantTeachers: req.user._id }
      ];
    } else if (req.user.role === 'student') {
      searchQuery['students.student'] = req.user._id;
      searchQuery['students.status'] = 'active';
    } else if (req.user.role === 'parent') {
      // Get parent's children
      const parent = await User.findById(req.user._id).populate('children');
      if (parent.children.length > 0) {
        const childrenIds = parent.children.map(child => child._id);
        searchQuery['students.student'] = { $in: childrenIds };
        searchQuery['students.status'] = 'active';
      } else {
        // If no children, return empty result
        return res.status(200).json({
          success: true,
          data: {
            batches: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalBatches: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }
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
    const [batches, totalBatches] = await Promise.all([
      Batch.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('teacher', 'firstName lastName email phone qualifications')
        .populate('assistantTeachers', 'firstName lastName email')
        .populate('students.student', 'firstName lastName email studentId grade')
        .lean(),
      Batch.countDocuments(searchQuery)
    ]);
    
    const totalPages = Math.ceil(totalBatches / limit);
    
    res.status(200).json({
      success: true,
      data: {
        batches,
        pagination: {
          currentPage: page,
          totalPages,
          totalBatches,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/batches/stats
// @desc    Get batch statistics
// @access  Private (Admin only)
router.get('/stats',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const stats = await Batch.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalStudents: { $sum: '$currentStudents' },
          avgAttendance: { $avg: '$averageAttendance' }
        }
      }
    ]);
    
    // Get subject-wise statistics
    const subjectStats = await Batch.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          totalStudents: { $sum: '$currentStudents' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get grade-wise statistics
    const gradeStats = await Batch.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          totalStudents: { $sum: '$currentStudents' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get recent batch registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBatches = await Batch.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      data: {
        statusStats: stats,
        subjectStats,
        gradeStats,
        recentBatches,
        totalBatches: stats.reduce((sum, stat) => sum + stat.count, 0),
        totalEnrollments: stats.reduce((sum, stat) => sum + stat.totalStudents, 0)
      }
    });
  })
);
router.get('/my-batches',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const batches = await Batch.find({
      $or: [
        { teacher: req.user._id },
        { assistantTeachers: req.user._id }
      ]
    })
    .populate('students.student', 'firstName lastName email studentId')
    .select('name code subject grade level schedule currentStudents maxStudents status startDate endDate');
    
    res.status(200).json({
      success: true,
      data: batches
    });
  })
);
// @route   GET /api/batches/:id
// @desc    Get batch by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    let batch = await Batch.findById(id)
      .populate('teacher', 'firstName lastName email phone qualifications experience')
      .populate('assistantTeachers', 'firstName lastName email phone')
      .populate('students.student', 'firstName lastName email studentId grade phone parentId')
      .populate({
        path: 'students.student',
        populate: {
          path: 'parentId',
          select: 'firstName lastName email phone'
        }
      });
    
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check access permissions
    if (req.user.role === 'teacher') {
      if (!batch.teacher._id.equals(req.user._id) && 
          !batch.assistantTeachers.some(at => at._id.equals(req.user._id))) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'student') {
      const isEnrolled = batch.students.some(s => 
        s.student._id.equals(req.user._id) && s.status === 'active'
      );
      if (!isEnrolled) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const childrenIds = parent.children.map(child => child._id.toString());
      const hasChild = batch.students.some(s => 
        childrenIds.includes(s.student._id.toString()) && s.status === 'active'
      );
      if (!hasChild) {
        throw new AppError('Access denied', 403);
      }
    }
    
    // Get additional data for admin and teacher
    let additionalData = {};
    
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      // Get recent attendance summary
      const recentAttendance = await Attendance.find({ batch: id })
        .sort({ date: -1 })
        .limit(10)
        .select('date classDetails students')
        .lean();
      
      additionalData.recentAttendance = recentAttendance;
      
      // Get batch performance metrics
      const attendanceStats = await Attendance.aggregate([
        { $match: { batch: batch._id } },
        { $unwind: '$students' },
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            avgAttendance: {
              $avg: {
                $cond: [{ $eq: ['$students.status', 'present'] }, 1, 0]
              }
            }
          }
        }
      ]);
      
      if (attendanceStats.length > 0) {
        additionalData.attendanceStats = attendanceStats[0];
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        batch,
        ...additionalData
      }
    });
  })
);

// @route   POST /api/batches
// @desc    Create new batch
// @access  Private (Admin only)
router.post('/',
  authenticateToken,
  authorizeRoles('admin'),
  batchValidationRules.createBatch,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const batchData = req.body;
    
    // Check if batch code already exists
    if (batchData.code) {
      const existingBatch = await Batch.findOne({ code: batchData.code });
      if (existingBatch) {
        throw new AppError('Batch code already exists', 400);
      }
    }
    
    // Verify teacher exists and is available
    const teacher = await User.findById(batchData.teacher);
    if (!teacher || teacher.role !== 'teacher' || teacher.status !== 'active') {
      throw new AppError('Invalid or inactive teacher', 400);
    }
    
    // Verify assistant teachers if provided
    if (batchData.assistantTeachers && batchData.assistantTeachers.length > 0) {
      const assistants = await User.find({
        _id: { $in: batchData.assistantTeachers },
        role: 'teacher',
        status: 'active'
      });
      
      if (assistants.length !== batchData.assistantTeachers.length) {
        throw new AppError('One or more assistant teachers are invalid or inactive', 400);
      }
    }
    
    // Check for schedule conflicts
    if (batchData.schedule && batchData.schedule.length > 0) {
      const conflictingBatches = await Batch.find({
        teacher: batchData.teacher,
        status: { $in: ['active', 'draft'] },
        $or: batchData.schedule.map(s => ({
          'schedule': {
            $elemMatch: {
              day: s.day,
              startTime: { $lt: s.endTime },
              endTime: { $gt: s.startTime }
            }
          }
        }))
      });
      
      if (conflictingBatches.length > 0) {
        throw new AppError('Schedule conflicts with existing batches', 400);
      }
    }
    
    // Create batch
    const batch = new Batch({
      ...batchData,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    });
    
    await batch.save();
    
    // Populate the created batch
    await batch.populate([
      { path: 'teacher', select: 'firstName lastName email phone' },
      { path: 'assistantTeachers', select: 'firstName lastName email phone' }
    ]);
    
    // Send notification to assigned teacher
    try {
      const notification = new Notification({
        title: 'New Batch Assignment',
        message: `You have been assigned as teacher for batch: ${batch.name}`,
        type: 'assignment',
        category: 'academic',
        priority: 'high',
        sender: req.user._id,
        recipients: [{
          user: batch.teacher._id,
          role: 'teacher'
        }]
      });
      
      await notification.save();
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(batch.teacher._id.toString()).emit('batchAssigned', {
          batchId: batch._id,
          batchName: batch.name,
          subject: batch.subject,
          grade: batch.grade,
          assignedBy: req.user.fullName,
          timestamp: new Date()
        });
        
        // Notify admin users
        io.to('admin').emit('batchCreated', {
          batchId: batch._id,
          batchName: batch.name,
          teacher: batch.teacher.fullName,
          createdBy: req.user.fullName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send batch assignment notification:', error);
    }
    
    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: { batch }
    });
  })
);

// @route   PUT /api/batches/:id
// @desc    Update batch
// @access  Private (Admin only)
router.put('/:id',
  authenticateToken,
  authorizeRoles('admin'),
  batchValidationRules.updateBatch,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check if batch code is being changed and if it already exists
    if (updateData.code && updateData.code !== batch.code) {
      const existingBatch = await Batch.findOne({ 
        code: updateData.code, 
        _id: { $ne: id } 
      });
      if (existingBatch) {
        throw new AppError('Batch code already exists', 400);
      }
    }
    
    // Verify teacher if being changed
    if (updateData.teacher && updateData.teacher !== batch.teacher.toString()) {
      const teacher = await User.findById(updateData.teacher);
      if (!teacher || teacher.role !== 'teacher' || teacher.status !== 'active') {
        throw new AppError('Invalid or inactive teacher', 400);
      }
      
      // Check for schedule conflicts with new teacher
      if (batch.schedule && batch.schedule.length > 0) {
        const conflictingBatches = await Batch.find({
          teacher: updateData.teacher,
          status: { $in: ['active', 'draft'] },
          _id: { $ne: id },
          $or: batch.schedule.map(s => ({
            'schedule': {
              $elemMatch: {
                day: s.day,
                startTime: { $lt: s.endTime },
                endTime: { $gt: s.startTime }
              }
            }
          }))
        });
        
        if (conflictingBatches.length > 0) {
          throw new AppError('Schedule conflicts with new teacher\'s existing batches', 400);
        }
      }
    }
    
    // Verify assistant teachers if being changed
    if (updateData.assistantTeachers) {
      const assistants = await User.find({
        _id: { $in: updateData.assistantTeachers },
        role: 'teacher',
        status: 'active'
      });
      
      if (assistants.length !== updateData.assistantTeachers.length) {
        throw new AppError('One or more assistant teachers are invalid or inactive', 400);
      }
    }
    
    const oldTeacher = batch.teacher;
    
    // Update batch
    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate([
      { path: 'teacher', select: 'firstName lastName email phone' },
      { path: 'assistantTeachers', select: 'firstName lastName email phone' },
      { path: 'students.student', select: 'firstName lastName email studentId' }
    ]);
    
    // Send notifications if teacher changed
    if (updateData.teacher && updateData.teacher !== oldTeacher.toString()) {
      try {
        const io = req.app.get('io');
        
        // Notify new teacher
        const newTeacherNotification = new Notification({
          title: 'Batch Assignment',
          message: `You have been assigned as teacher for batch: ${updatedBatch.name}`,
          type: 'assignment',
          category: 'academic',
          priority: 'high',
          sender: req.user._id,
          recipients: [{
            user: updateData.teacher,
            role: 'teacher'
          }]
        });
        await newTeacherNotification.save();
        
        // Notify old teacher
        const oldTeacherNotification = new Notification({
          title: 'Batch Reassignment',
          message: `You have been removed as teacher from batch: ${updatedBatch.name}`,
          type: 'info',
          category: 'academic',
          priority: 'medium',
          sender: req.user._id,
          recipients: [{
            user: oldTeacher,
            role: 'teacher'
          }]
        });
        await oldTeacherNotification.save();
        
        // Real-time notifications
        if (io) {
          io.to(updateData.teacher).emit('batchAssigned', {
            batchId: updatedBatch._id,
            batchName: updatedBatch.name,
            timestamp: new Date()
          });
          
          io.to(oldTeacher.toString()).emit('batchUnassigned', {
            batchId: updatedBatch._id,
            batchName: updatedBatch.name,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Failed to send teacher reassignment notifications:', error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: { batch: updatedBatch }
    });
  })
);

// @route   PUT /api/batches/:id/status
// @desc    Update batch status
// @access  Private (Admin only)
router.put('/:id/status',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['draft', 'active', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status specified', 400);
    }
    
    const batch = await Batch.findById(id)
      .populate('teacher', 'firstName lastName email')
      .populate('students.student', 'firstName lastName email parentId');
    
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    const oldStatus = batch.status;
    
    // Update status
    batch.status = status;
    batch.lastUpdatedBy = req.user._id;
    
    if (status === 'cancelled' && reason) {
      batch.metadata = { ...batch.metadata, cancellationReason: reason };
    }
    
    await batch.save();
    
    // Send notifications to affected users
    try {
      const recipients = [
        { user: batch.teacher._id, role: 'teacher' }
      ];
      
      // Add active students
      batch.students
        .filter(s => s.status === 'active')
        .forEach(student => {
          recipients.push({ user: student.student._id, role: 'student' });
          
          // Add parents if they exist
          if (student.student.parentId) {
            recipients.push({ user: student.student.parentId, role: 'parent' });
          }
        });
      
      const notification = new Notification({
        title: `Batch Status Updated`,
        message: `Batch "${batch.name}" status has been changed from ${oldStatus} to ${status}${reason ? `. Reason: ${reason}` : ''}`,
        type: status === 'cancelled' ? 'alert' : 'info',
        category: 'academic',
        priority: status === 'cancelled' ? 'high' : 'medium',
        sender: req.user._id,
        recipients
      });
      
      await notification.save();
      
      // Real-time notifications
      const io = req.app.get('io');
      if (io) {
        recipients.forEach(recipient => {
          io.to(recipient.user.toString()).emit('batchStatusChanged', {
            batchId: batch._id,
            batchName: batch.name,
            oldStatus,
            newStatus: status,
            reason,
            timestamp: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Failed to send batch status notifications:', error);
    }
    
    res.status(200).json({
      success: true,
      message: `Batch status updated to ${status}`,
      data: { batch }
    });
  })
);

// @route   POST /api/batches/:id/students
// @desc    Add students to batch
// @access  Private (Admin only)
router.post('/:id/students',
  authenticateToken,
  authorizeRoles('admin'),
  batchValidationRules.addStudents,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { studentIds } = req.body;
    
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    if (batch.status === 'completed' || batch.status === 'cancelled') {
      throw new AppError('Cannot add students to completed or cancelled batch', 400);
    }
    
    // Verify students exist and are valid
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      status: 'active'
    });
    
    if (students.length !== studentIds.length) {
      throw new AppError('One or more students are invalid or inactive', 400);
    }
    
    const results = {
      added: [],
      alreadyEnrolled: [],
      errors: []
    };
    
    for (const studentId of studentIds) {
      try {
        // Check if student is already enrolled
        const existingStudent = batch.students.find(s => 
          s.student.toString() === studentId && s.status === 'active'
        );
        
        if (existingStudent) {
          const student = students.find(s => s._id.toString() === studentId);
          results.alreadyEnrolled.push({
            id: studentId,
            name: student.fullName
          });
          continue;
        }
        
        // Check if batch is full
        if (batch.isFullyBooked) {
          throw new AppError('Batch is fully booked', 400);
        }
        
        // Add student using batch method
        await batch.addStudent(studentId);
        
        const student = students.find(s => s._id.toString() === studentId);
        results.added.push({
          id: studentId,
          name: student.fullName
        });
        
        // Send notification to student
        const notification = new Notification({
          title: 'Batch Enrollment',
          message: `You have been enrolled in batch: ${batch.name}`,
          type: 'enrollment',
          category: 'academic',
          priority: 'high',
          sender: req.user._id,
          recipients: [{
            user: studentId,
            role: 'student'
          }]
        });
        
        await notification.save();
        
        // Notify parent if exists
        if (student.parentId) {
          const parentNotification = new Notification({
            title: 'Child Batch Enrollment',
            message: `Your child ${student.fullName} has been enrolled in batch: ${batch.name}`,
            type: 'enrollment',
            category: 'academic',
            priority: 'high',
            sender: req.user._id,
            recipients: [{
              user: student.parentId,
              role: 'parent'
            }]
          });
          
          await parentNotification.save();
        }
        
      } catch (error) {
        const student = students.find(s => s._id.toString() === studentId);
        results.errors.push({
          id: studentId,
          name: student?.fullName || 'Unknown',
          error: error.message
        });
      }
    }
    
    // Real-time notifications
    const io = req.app.get('io');
    if (io) {
      results.added.forEach(student => {
        io.to(student.id).emit('batchEnrolled', {
          batchId: batch._id,
          batchName: batch.name,
          timestamp: new Date()
        });
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student enrollment process completed',
      data: results
    });
  })
);

// @route   DELETE /api/batches/:id/students/:studentId
// @desc    Remove student from batch
// @access  Private (Admin only)
router.delete('/:id/students/:studentId',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id, studentId } = req.params;
    const { reason } = req.body;
    
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new AppError('Student not found', 404);
    }
    
    // Remove student using batch method
    try {
      await batch.removeStudent(studentId);
    } catch (error) {
      throw new AppError(error.message, 400);
    }
    
    // Send notifications
    try {
      const notification = new Notification({
        title: 'Batch Removal',
        message: `You have been removed from batch: ${batch.name}${reason ? `. Reason: ${reason}` : ''}`,
        type: 'alert',
        category: 'academic',
        priority: 'high',
        sender: req.user._id,
        recipients: [{
          user: studentId,
          role: 'student'
        }]
      });
      
      await notification.save();
      
      // Notify parent if exists
      if (student.parentId) {
        const parentNotification = new Notification({
          title: 'Child Batch Removal',
          message: `Your child ${student.fullName} has been removed from batch: ${batch.name}${reason ? `. Reason: ${reason}` : ''}`,
          type: 'alert',
          category: 'academic',
          priority: 'high',
          sender: req.user._id,
          recipients: [{
            user: student.parentId,
            role: 'parent'
          }]
        });
        
        await parentNotification.save();
      }
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(studentId).emit('batchRemoved', {
          batchId: batch._id,
          batchName: batch.name,
          reason,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send batch removal notifications:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Student removed from batch successfully'
    });
  })
);

// @route   GET /api/batches/:id/attendance
// @desc    Get batch attendance records
// @access  Private (Admin, Teacher of batch)
router.get('/:id/attendance',
  authenticateToken,
  queryValidation.pagination,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && 
        !batch.teacher.equals(req.user._id) && 
        !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
      throw new AppError('Access denied', 403);
    }
    
    const { page, limit, skip } = getPaginationOptions(req);
    
    // Build date filter
    const dateFilter = {};
    if (req.query.startDate) {
      dateFilter.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      dateFilter.$lte = new Date(req.query.endDate);
    }
    
    const query = { batch: id };
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    const [attendanceRecords, totalRecords] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('teacher', 'firstName lastName')
        .populate('students.student', 'firstName lastName studentId'),
      Attendance.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalRecords / limit);
    
    res.status(200).json({
      success: true,
      data: {
        attendanceRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  })
);

// @route   GET /api/batches/:id/schedule
// @desc    Get batch schedule
// @access  Private
router.get('/:id/schedule',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const batch = await Batch.findById(id)
      .select('name code schedule teacher')
      .populate('teacher', 'firstName lastName email phone');
    
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check access permissions
    if (req.user.role === 'teacher') {
      if (!batch.teacher._id.equals(req.user._id)) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'student') {
      const studentBatch = await Batch.findOne({
        _id: id,
        'students.student': req.user._id,
        'students.status': 'active'
      });
      if (!studentBatch) {
        throw new AppError('Access denied', 403);
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        batchId: batch._id,
        batchName: batch.name,
        batchCode: batch.code,
        teacher: batch.teacher,
        schedule: batch.schedule
      }
    });
  })
);

// @route   DELETE /api/batches/:id
// @desc    Delete batch
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const batch = await Batch.findById(id)
      .populate('teacher', 'firstName lastName email')
      .populate('students.student', 'firstName lastName email');
    
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check if batch has active students
    const activeStudents = batch.students.filter(s => s.status === 'active');
    if (activeStudents.length > 0) {
      throw new AppError('Cannot delete batch with active students. Please remove students first.', 400);
    }
    
    // Check if batch has attendance records
    const attendanceCount = await Attendance.countDocuments({ batch: id });
    if (attendanceCount > 0) {
      throw new AppError('Cannot delete batch with attendance records. Please archive instead.', 400);
    }
    
    // Delete batch
    await Batch.findByIdAndDelete(id);
    
    // Send notification to teacher
    try {
      const notification = new Notification({
        title: 'Batch Deleted',
        message: `Batch "${batch.name}" has been deleted`,
        type: 'alert',
        category: 'academic',
        priority: 'medium',
        sender: req.user._id,
        recipients: [{
          user: batch.teacher._id,
          role: 'teacher'
        }]
      });
      
      await notification.save();
      
      // Real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(batch.teacher._id.toString()).emit('batchDeleted', {
          batchId: id,
          batchName: batch.name,
          deletedBy: req.user.fullName,
          timestamp: new Date()
        });
        
        io.to('admin').emit('batchDeleted', {
          batchId: id,
          batchName: batch.name,
          teacher: batch.teacher.fullName,
          deletedBy: req.user.fullName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send batch deletion notifications:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully'
    });
  })
);
// Add these routes before "export default router;" line

// @route   GET /api/batches/student/:studentId
// @desc    Get batches for a specific student
// @access  Private (Student, Admin, Parent)
router.get('/student/:studentId',
  authenticateToken,
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
    
    const batches = await Batch.find({
      'students.student': studentId,
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

// @route   GET /api/batches/my-batches
// @desc    Get batches for current teacher
// @access  Private (Teacher)


// @route   POST /api/batches/:id/join
// @desc    Student joins a batch
// @access  Private (Student)
router.post('/:id/join',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;
    
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    if (batch.status !== 'active') {
      throw new AppError('Cannot join inactive batch', 400);
    }
    
    // Check if student is already enrolled
    const existingStudent = batch.students.find(s => 
      s.student.toString() === studentId.toString() && s.status === 'active'
    );
    
    if (existingStudent) {
      throw new AppError('Already enrolled in this batch', 400);
    }
    
    // Check if batch is full
    if (batch.currentStudents >= batch.maxStudents) {
      throw new AppError('Batch is full', 400);
    }
    
    // Add student to batch
    batch.students.push({
      student: studentId,
      status: 'active',
      enrollmentDate: new Date()
    });
    
    batch.currentStudents = batch.students.filter(s => s.status === 'active').length;
    await batch.save();
    
    // Create notification for teacher
    const notification = new Notification({
      title: 'New Student Enrollment',
      message: `${req.user.firstName} ${req.user.lastName} has joined batch: ${batch.name}`,
      type: 'enrollment',
      category: 'academic',
      priority: 'medium',
      sender: studentId,
      recipients: [{
        user: batch.teacher,
        role: 'teacher'
      }]
    });
    
    await notification.save();
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(batch.teacher.toString()).emit('studentJoined', {
        batchId: batch._id,
        batchName: batch.name,
        studentName: req.user.fullName,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Successfully joined the batch',
      data: { batch: { _id: batch._id, name: batch.name, code: batch.code } }
    });
  })
);

// @route   POST /api/batches/:id/leave
// @desc    Student leaves a batch
// @access  Private (Student)
router.post('/:id/leave',
  authenticateToken,
  authorizeRoles('student'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const studentId = req.user._id;
    const { reason } = req.body;
    
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Find and remove student
    const studentIndex = batch.students.findIndex(s => 
      s.student.toString() === studentId.toString() && s.status === 'active'
    );
    
    if (studentIndex === -1) {
      throw new AppError('Not enrolled in this batch', 400);
    }
    
    // Mark as withdrawn instead of removing
    batch.students[studentIndex].status = 'withdrawn';
    batch.students[studentIndex].withdrawalDate = new Date();
    if (reason) {
      batch.students[studentIndex].withdrawalReason = reason;
    }
    
    batch.currentStudents = batch.students.filter(s => s.status === 'active').length;
    await batch.save();
    
    // Create notification for teacher
    const notification = new Notification({
      title: 'Student Withdrawal',
      message: `${req.user.firstName} ${req.user.lastName} has left batch: ${batch.name}${reason ? ` (Reason: ${reason})` : ''}`,
      type: 'enrollment',
      category: 'academic',
      priority: 'medium',
      sender: studentId,
      recipients: [{
        user: batch.teacher,
        role: 'teacher'
      }]
    });
    
    await notification.save();
    
    // Real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(batch.teacher.toString()).emit('studentLeft', {
        batchId: batch._id,
        batchName: batch.name,
        studentName: req.user.fullName,
        reason: reason || null,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Successfully left the batch'
    });
  })
);


export default router;