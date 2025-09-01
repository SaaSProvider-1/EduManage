import express from 'express';
import Attendance from '../models/Attendance.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken, authorizeRoles, checkPermission } from '../middleware/auth.js';
import { attendanceValidationRules, handleValidationErrors, queryValidation } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

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
    const month = parseInt(req.query.month) - 1; // JavaScript months are 0-indexed
    const year = parseInt(req.query.year);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    dateQuery.$gte = startDate;
    dateQuery.$lte = endDate;
  }
  
  return Object.keys(dateQuery).length > 0 ? dateQuery : null;
};

// @route   GET /api/attendance
// @desc    Get attendance records with filtering and pagination
// @access  Private (Admin, Teacher)
router.get('/',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { page, limit, skip } = getPaginationOptions(req);
    let query = {};
    
    // Build date range query
    const dateQuery = buildDateQuery(req);
    if (dateQuery) {
      query.date = dateQuery;
    }
    
    // Filter by batch if specified
    if (req.query.batch) {
      query.batch = req.query.batch;
    }
    
    // Filter by teacher if specified
    if (req.query.teacher) {
      query.teacher = req.query.teacher;
    }
    
    // Role-based filtering
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      query['students.student'] = req.user._id;
    } else if (req.user.role === 'parent') {
      // Get parent's children
      const parent = await User.findById(req.user._id).populate('children');
      if (parent.children.length > 0) {
        const childrenIds = parent.children.map(child => child._id);
        query['students.student'] = { $in: childrenIds };
      } else {
        return res.status(200).json({
          success: true,
          data: {
            attendanceRecords: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalRecords: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }
    }
    
    // Execute queries in parallel
    const [attendanceRecords, totalRecords] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('batch', 'name code subject grade')
        .populate('teacher', 'firstName lastName email')
        .populate('students.student', 'firstName lastName studentId email')
        .lean(),
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

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
// @access  Private (Admin, Teacher)
router.get('/stats',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    let matchStage = {};
    
    // Build date range
    const dateQuery = buildDateQuery(req);
    if (dateQuery) {
      matchStage.date = dateQuery;
    }
    
    // Filter by teacher if not admin
    if (req.user.role === 'teacher') {
      matchStage.teacher = req.user._id;
    }
    
    // Filter by batch if specified
    if (req.query.batch) {
      matchStage.batch = req.query.batch;
    }
    
    // Get overall attendance statistics
    const overallStats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          totalStudentRecords: { $sum: '$totalStudents' },
          totalPresentRecords: { $sum: '$presentStudents' },
          totalAbsentRecords: { $sum: '$absentStudents' },
          avgAttendancePercentage: { $avg: '$attendancePercentage' }
        }
      }
    ]);
    
    // Get batch-wise statistics
    const batchStats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$batch',
          totalClasses: { $sum: 1 },
          avgAttendance: { $avg: '$attendancePercentage' },
          totalStudents: { $sum: '$totalStudents' },
          presentStudents: { $sum: '$presentStudents' }
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
      { $sort: { avgAttendance: -1 } }
    ]);
    
    // Get teacher performance (admin only)
    let teacherStats = [];
    if (req.user.role === 'admin') {
      teacherStats = await Attendance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$teacher',
            totalClasses: { $sum: 1 },
            avgAttendance: { $avg: '$attendancePercentage' },
            onTimeClasses: {
              $sum: { $cond: [{ $eq: ['$teacherAttendance.status', 'present'] }, 1, 0] }
            },
            lateClasses: {
              $sum: { $cond: [{ $eq: ['$teacherAttendance.status', 'late'] }, 1, 0] }
            }
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
        { $sort: { avgAttendance: -1 } }
      ]);
    }
    
    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalClasses: 0,
          totalStudentRecords: 0,
          totalPresentRecords: 0,
          totalAbsentRecords: 0,
          avgAttendancePercentage: 0
        },
        batchStats,
        teacherStats
      }
    });
  })
);

// @route   GET /api/attendance/:id
// @desc    Get attendance record by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const attendance = await Attendance.findById(id)
      .populate('batch', 'name code subject grade')
      .populate('teacher', 'firstName lastName email phone')
      .populate('students.student', 'firstName lastName studentId email grade')
      .populate({
        path: 'students.student',
        populate: {
          path: 'parentId',
          select: 'firstName lastName email phone'
        }
      });
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
    
    // Check access permissions
    if (req.user.role === 'teacher') {
      if (!attendance.teacher._id.equals(req.user._id)) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'student') {
      const hasAccess = attendance.students.some(s => 
        s.student._id.equals(req.user._id)
      );
      if (!hasAccess) {
        throw new AppError('Access denied', 403);
      }
    } else if (req.user.role === 'parent') {
      const parent = await User.findById(req.user._id).populate('children');
      const childrenIds = parent.children.map(child => child._id.toString());
      const hasAccess = attendance.students.some(s => 
        childrenIds.includes(s.student._id.toString())
      );
      if (!hasAccess) {
        throw new AppError('Access denied', 403);
      }
    }
    
    res.status(200).json({
      success: true,
      data: { attendance }
    });
  })
);

// @route   POST /api/attendance
// @desc    Mark attendance for a class
// @access  Private (Admin, Teacher)
router.post('/',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  attendanceValidationRules.mark,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const {
      batch: batchId,
      date,
      students,
      classDetails,
      teacherAttendance,
      weather,
      specialNotes
    } = req.body;
    
    // Verify batch exists and user has permission
    const batch = await Batch.findById(batchId)
      .populate('teacher', 'firstName lastName email')
      .populate('students.student', 'firstName lastName email studentId parentId');
    
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    // Check if user is authorized to mark attendance for this batch
    if (req.user.role === 'teacher' && 
        !batch.teacher._id.equals(req.user._id) && 
        !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
      throw new AppError('Access denied - not assigned to this batch', 403);
    }
    
    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      batch: batchId,
      date: new Date(date)
    });
    
    if (existingAttendance) {
      throw new AppError('Attendance already marked for this date', 400);
    }
    
    // Validate students belong to the batch
    const batchStudentIds = batch.students
      .filter(s => s.status === 'active')
      .map(s => s.student._id.toString());
    
    const invalidStudents = students.filter(s => 
      !batchStudentIds.includes(s.student.toString())
    );
    
    if (invalidStudents.length > 0) {
      throw new AppError('Some students are not enrolled in this batch', 400);
    }
    
    // Create attendance record
    const attendance = new Attendance({
      batch: batchId,
      date: new Date(date),
      teacher: req.user.role === 'admin' ? batch.teacher._id : req.user._id,
      students: students.map(s => ({
        student: s.student,
        status: s.status,
        arrivalTime: s.arrivalTime ? new Date(s.arrivalTime) : undefined,
        departureTime: s.departureTime ? new Date(s.departureTime) : undefined,
        remarks: s.remarks || ''
      })),
      classDetails: classDetails || {},
      teacherAttendance: teacherAttendance || { status: 'present' },
      weather,
      specialNotes,
      markedBy: req.user._id
    });
    
    await attendance.save();
    
    // Update batch average attendance
    const batchAttendanceStats = await Attendance.aggregate([
      { $match: { batch: batch._id } },
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$attendancePercentage' }
        }
      }
    ]);
    
    if (batchAttendanceStats.length > 0) {
      await batch.updateAttendance(batchAttendanceStats[0].avgAttendance);
    }
    
    // Send notifications for absent students
    try {
      const absentStudents = attendance.students.filter(s => s.status === 'absent');
      
      for (const absentStudent of absentStudents) {
        const student = batch.students.find(s => 
          s.student._id.equals(absentStudent.student)
        );
        
        if (student && student.student.parentId) {
          // Notify parent
          const parentNotification = new Notification({
            title: 'Student Absence Alert',
            message: `Your child ${student.student.firstName} ${student.student.lastName} was absent from ${batch.name} class on ${new Date(date).toLocaleDateString()}`,
            type: 'attendance',
            category: 'academic',
            priority: 'medium',
            sender: req.user._id,
            recipients: [{
              user: student.student.parentId,
              role: 'parent'
            }]
          });
          
          await parentNotification.save();
        }
      }
      
      // Real-time notifications
      const io = req.app.get('io');
      if (io) {
        // Notify absent students' parents
        absentStudents.forEach(absentStudent => {
          const student = batch.students.find(s => 
            s.student._id.equals(absentStudent.student)
          );
          
          if (student && student.student.parentId) {
            io.to(student.student.parentId.toString()).emit('attendanceMarked', {
              studentName: `${student.student.firstName} ${student.student.lastName}`,
              batchName: batch.name,
              date: new Date(date).toLocaleDateString(),
              status: 'absent',
              timestamp: new Date()
            });
          }
        });
        
        // Notify admin about attendance completion
        io.to('admin').emit('attendanceSubmitted', {
          batchName: batch.name,
          date: new Date(date).toLocaleDateString(),
          teacherName: batch.teacher.firstName + ' ' + batch.teacher.lastName,
          attendancePercentage: attendance.attendancePercentage,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send attendance notifications:', error);
    }
    
    // Populate and return the created attendance
    await attendance.populate([
      { path: 'batch', select: 'name code subject grade' },
      { path: 'teacher', select: 'firstName lastName email' },
      { path: 'students.student', select: 'firstName lastName studentId email' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance }
    });
  })
);

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Admin, Teacher who marked it)
router.put('/:id',
  authenticateToken,
  attendanceValidationRules.update,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const attendance = await Attendance.findById(id)
      .populate('batch', 'name teacher')
      .populate('teacher', 'firstName lastName');
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'teacher') {
      if (!attendance.teacher._id.equals(req.user._id)) {
        throw new AppError('Access denied - can only edit your own attendance records', 403);
      }
    }
    
    // Prevent updating attendance after 24 hours (configurable)
    const maxEditHours = parseInt(process.env.ATTENDANCE_EDIT_LIMIT_HOURS) || 24;
    const hoursSinceMarked = (new Date() - attendance.markedAt) / (1000 * 60 * 60);
    
    if (hoursSinceMarked > maxEditHours && req.user.role !== 'admin') {
      throw new AppError(`Attendance can only be edited within ${maxEditHours} hours of marking`, 400);
    }
    
    // Update allowed fields
    const allowedUpdates = ['students', 'classDetails', 'teacherAttendance', 'specialNotes'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    // Add update metadata
    updateData.updatedBy = req.user._id;
    updateData.lastUpdated = new Date();
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'batch', select: 'name code subject grade' },
      { path: 'teacher', select: 'firstName lastName email' },
      { path: 'students.student', select: 'firstName lastName studentId email' }
    ]);
    
    // Recalculate batch average attendance if student attendance was updated
    if (updates.students) {
      const batchAttendanceStats = await Attendance.aggregate([
        { $match: { batch: attendance.batch._id } },
        {
          $group: {
            _id: null,
            avgAttendance: { $avg: '$attendancePercentage' }
          }
        }
      ]);
      
      if (batchAttendanceStats.length > 0) {
        await Batch.findByIdAndUpdate(
          attendance.batch._id,
          { averageAttendance: batchAttendanceStats[0].avgAttendance }
        );
      }
    }
    
    // Send notification about attendance update
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('attendanceUpdated', {
          attendanceId: id,
          batchName: attendance.batch.name,
          teacherName: attendance.teacher.firstName + ' ' + attendance.teacher.lastName,
          updatedBy: req.user.firstName + ' ' + req.user.lastName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send attendance update notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance: updatedAttendance }
    });
  })
);

// @route   PUT /api/attendance/:id/students/:studentId
// @desc    Update individual student attendance
// @access  Private (Admin, Teacher of the batch)
router.put('/:id/students/:studentId',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id, studentId } = req.params;
    const { status, arrivalTime, departureTime, remarks } = req.body;
    
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      throw new AppError('Invalid attendance status', 400);
    }
    
    const attendance = await Attendance.findById(id)
      .populate('batch', 'name teacher')
      .populate('teacher', 'firstName lastName')
      .populate('students.student', 'firstName lastName studentId parentId');
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        !attendance.teacher._id.equals(req.user._id)) {
      throw new AppError('Access denied', 403);
    }
    
    // Update student attendance using model method
    await attendance.markStudentAttendance(
      studentId,
      status,
      arrivalTime ? new Date(arrivalTime) : null,
      remarks
    );
    
    // Find the updated student record
    const updatedStudent = attendance.students.find(s => 
      s.student._id.equals(studentId)
    );
    
    if (!updatedStudent) {
      throw new AppError('Student not found in attendance record', 404);
    }
    
    // Send notification if status changed to absent
    if (status === 'absent' && updatedStudent.student.parentId) {
      try {
        const notification = new Notification({
          title: 'Student Absence Alert',
          message: `Your child ${updatedStudent.student.firstName} ${updatedStudent.student.lastName} was marked absent from ${attendance.batch.name} class`,
          type: 'attendance',
          category: 'academic',
          priority: 'medium',
          sender: req.user._id,
          recipients: [{
            user: updatedStudent.student.parentId,
            role: 'parent'
          }]
        });
        
        await notification.save();
        
        // Real-time notification
        const io = req.app.get('io');
        if (io) {
          io.to(updatedStudent.student.parentId.toString()).emit('attendanceUpdated', {
            studentName: `${updatedStudent.student.firstName} ${updatedStudent.student.lastName}`,
            batchName: attendance.batch.name,
            status,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Failed to send absence notification:', error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Student attendance updated successfully',
      data: {
        studentAttendance: {
          student: updatedStudent.student,
          status: updatedStudent.status,
          arrivalTime: updatedStudent.arrivalTime,
          departureTime: updatedStudent.departureTime,
          remarks: updatedStudent.remarks,
          lateMinutes: updatedStudent.lateMinutes
        }
      }
    });
  })
);

// @route   GET /api/attendance/student/:studentId
// @desc    Get student's attendance records
// @access  Private (Admin, Teacher, Student themselves, Parent)
router.get('/student/:studentId',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { studentId } = req.params;
    
    // Check if user has permission to view this student's attendance
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
    
    // Build query
    let query = { 'students.student': studentId };
    
    // Add date range if specified
    const dateQuery = buildDateQuery(req);
    if (dateQuery) {
      query.date = dateQuery;
    }
    
    // Add batch filter if specified and user is authorized
    if (req.query.batch) {
      if (req.user.role === 'teacher') {
        // Verify teacher teaches this batch
        const batch = await Batch.findById(req.query.batch);
        if (!batch || !batch.teacher.equals(req.user._id)) {
          throw new AppError('Access denied to this batch', 403);
        }
      }
      query.batch = req.query.batch;
    }
    
    const [attendanceRecords, totalRecords] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('batch', 'name code subject grade')
        .populate('teacher', 'firstName lastName')
        .lean(),
      Attendance.countDocuments(query)
    ]);
    
    // Filter to show only the specific student's attendance in each record
    const studentAttendanceRecords = attendanceRecords.map(record => ({
      _id: record._id,
      batch: record.batch,
      teacher: record.teacher,
      date: record.date,
      classDetails: record.classDetails,
      studentAttendance: record.students.find(s => s.student.toString() === studentId),
      attendancePercentage: record.attendancePercentage
    }));
    
    // Get attendance statistics for this student
    const stats = await Attendance.getStudentAttendanceStats(studentId, req.query.batch);
    
    const totalPages = Math.ceil(totalRecords / limit);
    
    res.status(200).json({
      success: true,
      data: {
        studentId,
        attendanceRecords: studentAttendanceRecords,
        statistics: stats[0] || {
          totalClasses: 0,
          presentClasses: 0,
          absentClasses: 0,
          lateClasses: 0,
          attendancePercentage: 0
        },
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

// @route   GET /api/attendance/batch/:batchId
// @desc    Get batch attendance records
// @access  Private (Admin, Teacher of batch)
router.get('/batch/:batchId',
  authenticateToken,
  queryValidation.pagination,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { batchId } = req.params;
    
    // Verify batch exists and check permissions
    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }
    
    if (req.user.role === 'teacher' && 
        !batch.teacher.equals(req.user._id) && 
        !batch.assistantTeachers.some(at => at.equals(req.user._id))) {
      throw new AppError('Access denied', 403);
    }
    
    const { page, limit, skip } = getPaginationOptions(req);
    
    // Build query
    let query = { batch: batchId };
    
    const dateQuery = buildDateQuery(req);
    if (dateQuery) {
      query.date = dateQuery;
    }
    
    const [attendanceRecords, totalRecords, batchStats] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('teacher', 'firstName lastName')
        .populate('students.student', 'firstName lastName studentId'),
      Attendance.countDocuments(query),
      Attendance.getBatchAttendanceStats(batchId, req.query.month, req.query.year)
    ]);
    
    const totalPages = Math.ceil(totalRecords / limit);
    
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
        attendanceRecords,
        statistics: batchStats[0] || {
          totalClasses: 0,
          avgAttendancePercentage: 0,
          totalStudentRecords: 0,
          presentRecords: 0
        },
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

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record (Admin only)
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('admin'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const attendance = await Attendance.findById(id)
      .populate('batch', 'name')
      .populate('teacher', 'firstName lastName');
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
    
    // Check if attendance is recent (within edit window)
    const maxDeleteHours = parseInt(process.env.ATTENDANCE_DELETE_LIMIT_HOURS) || 48;
    const hoursSinceMarked = (new Date() - attendance.markedAt) / (1000 * 60 * 60);
    
    if (hoursSinceMarked > maxDeleteHours) {
      throw new AppError(`Attendance records older than ${maxDeleteHours} hours cannot be deleted`, 400);
    }
    
    await Attendance.findByIdAndDelete(id);
    
    // Recalculate batch average attendance
    const batchAttendanceStats = await Attendance.aggregate([
      { $match: { batch: attendance.batch._id } },
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$attendancePercentage' }
        }
      }
    ]);
    
    const newAvgAttendance = batchAttendanceStats.length > 0 ? 
      batchAttendanceStats[0].avgAttendance : 0;
    
    await Batch.findByIdAndUpdate(
      attendance.batch._id,
      { averageAttendance: newAvgAttendance }
    );
    
    // Send notification
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('attendanceDeleted', {
          attendanceId: id,
          batchName: attendance.batch.name,
          date: attendance.date,
          deletedBy: req.user.firstName + ' ' + req.user.lastName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to send deletion notification:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  })
);

// @route   GET /api/attendance/today
// @desc    Get today's attendance records
// @access  Private (Admin, Teacher)
router.get('/today',
  authenticateToken,
  authorizeRoles('admin', 'teacher'),
  catchAsync(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let query = {
      date: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    // Filter by teacher if not admin
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }
    
    const todayAttendance = await Attendance.find(query)
      .populate('batch', 'name code subject grade')
      .populate('teacher', 'firstName lastName')
      .populate('students.student', 'firstName lastName studentId')
      .sort({ 'batch.name': 1 });
    
    // Get pending batches (classes scheduled today but attendance not marked)
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    let batchQuery = {
      status: 'active',
      'schedule.day': currentDay
    };
    
    if (req.user.role === 'teacher') {
      batchQuery.teacher = req.user._id;
    }
    
    const scheduledBatches = await Batch.find(batchQuery)
      .populate('teacher', 'firstName lastName')
      .select('name code subject grade schedule teacher');
    
    const markedBatchIds = todayAttendance.map(a => a.batch._id.toString());
    const pendingBatches = scheduledBatches.filter(batch => 
      !markedBatchIds.includes(batch._id.toString())
    );
    
    res.status(200).json({
      success: true,
      data: {
        date: today,
        markedAttendance: todayAttendance,
        pendingBatches,
        summary: {
          totalScheduledClasses: scheduledBatches.length,
          attendanceMarked: todayAttendance.length,
          pendingClasses: pendingBatches.length
        }
      }
    });
  })
);
// Add these routes before the export statement

// @route   GET /api/attendance/teacher-stats
// @desc    Get attendance statistics for teacher
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
    
    // Get total attendance records
    const totalRecords = await Attendance.countDocuments({
      batch: { $in: batchIds }
    });
    
    // Get today's attendance
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayRecords = await Attendance.countDocuments({
      batch: { $in: batchIds },
      date: { $gte: todayStart, $lte: todayEnd }
    });
    
    // Get this week's attendance statistics
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyStats = await Attendance.aggregate([
      {
        $match: {
          batch: { $in: batchIds },
          date: { $gte: weekStart }
        }
      },
      {
        $unwind: '$students'
      },
      {
        $group: {
          _id: '$students.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get monthly attendance trend
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlyTrend = await Attendance.aggregate([
      {
        $match: {
          batch: { $in: batchIds },
          date: { $gte: monthStart }
        }
      },
      {
        $unwind: '$students'
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            status: '$students.status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.day': 1 }
      }
    ]);
    
    // Format weekly stats
    const weeklyFormatted = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };
    
    weeklyStats.forEach(stat => {
      if (weeklyFormatted.hasOwnProperty(stat._id)) {
        weeklyFormatted[stat._id] = stat.count;
      }
    });
    
    const totalWeeklyStudents = Object.values(weeklyFormatted).reduce((a, b) => a + b, 0);
    const attendancePercentage = totalWeeklyStudents > 0 
      ? Math.round((weeklyFormatted.present / totalWeeklyStudents) * 100)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        todayRecords,
        weeklyStats: weeklyFormatted,
        attendancePercentage,
        monthlyTrend
      }
    });
  })
);
export default router;