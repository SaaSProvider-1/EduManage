import express from 'express';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import Notification from '../models/Notification.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { queryValidation, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics based on user role
// @access  Private (All roles)
router.get('/stats',
  authenticateToken,
  queryValidation.dateRange,
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { role, _id: userId } = req.user;
    let stats = {};

    // Build date filter
    const dateFilter = {};
    if (req.query.startDate) {
      dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      dateFilter.createdAt = { 
        ...dateFilter.createdAt, 
        $lte: new Date(req.query.endDate) 
      };
    }

    switch (role) {
      case 'admin':
        // Admin gets all system statistics
        const [
          totalUsers,
          totalBatches,
          totalStudents,
          totalTeachers,
          activeExams,
          pendingFees,
          recentAttendance,
          unreadNotifications
        ] = await Promise.all([
          User.countDocuments({ ...dateFilter, status: 'active' }),
          Batch.countDocuments({ ...dateFilter, status: 'active' }),
          User.countDocuments({ ...dateFilter, role: 'student', status: 'active' }),
          User.countDocuments({ ...dateFilter, role: 'teacher', status: 'active' }),
          Exam.countDocuments({ status: 'active' }),
          Fee.countDocuments({ status: 'pending' }),
          Attendance.countDocuments({
            date: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }),
          Notification.countDocuments({
            'recipients.user': userId,
            'recipients.isRead': false,
            status: 'sent'
          })
        ]);

        stats = {
          totalUsers,
          totalBatches,
          totalStudents,
          totalTeachers,
          activeExams,
          pendingFees,
          recentAttendance,
          unreadNotifications
        };
        break;

      case 'teacher':
        // Teacher gets statistics for their batches
        const teacherBatches = await Batch.find({
          $or: [
            { teacher: userId },
            { assistantTeachers: userId }
          ],
          status: 'active'
        }).select('_id');

        const batchIds = teacherBatches.map(batch => batch._id);

        const [
          myBatches,
          myStudents,
          upcomingExams,
          pendingAttendance,
          myNotifications
        ] = await Promise.all([
          batchIds.length,
          Batch.aggregate([
            { $match: { _id: { $in: batchIds } } },
            { $unwind: '$students' },
            { $match: { 'students.status': 'active' } },
            { $count: 'totalStudents' }
          ]).then(result => result[0]?.totalStudents || 0),
          Exam.countDocuments({
            batch: { $in: batchIds },
            status: 'active',
            startTime: { $gte: new Date() }
          }),
          Attendance.countDocuments({
            batch: { $in: batchIds },
            date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }),
          Notification.countDocuments({
            'recipients.user': userId,
            'recipients.isRead': false,
            status: 'sent'
          })
        ]);

        stats = {
          myBatches,
          myStudents,
          upcomingExams,
          pendingAttendance,
          myNotifications
        };
        break;

      case 'student':
        // Student gets their personal statistics
        const studentBatches = await Batch.find({
          'students.student': userId,
          'students.status': 'active'
        }).select('_id');

        const studentBatchIds = studentBatches.map(batch => batch._id);

        const [
          enrolledBatches,
          myAttendanceRate,
          upcomingStudentExams,
          pendingStudentFees,
          studentNotifications
        ] = await Promise.all([
          studentBatchIds.length,
          Attendance.aggregate([
            {
              $match: {
                batch: { $in: studentBatchIds },
                'students.student': userId
              }
            },
            {
              $unwind: '$students'
            },
            {
              $match: {
                'students.student': userId
              }
            },
            {
              $group: {
                _id: null,
                totalClasses: { $sum: 1 },
                attendedClasses: {
                  $sum: {
                    $cond: [
                      { $eq: ['$students.status', 'present'] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]).then(result => {
            const data = result[0];
            return data ? Math.round((data.attendedClasses / data.totalClasses) * 100) : 0;
          }),
          Exam.countDocuments({
            batch: { $in: studentBatchIds },
            status: 'active',
            scheduleDate: { $gte: new Date() }  // FIXED: Use scheduleDate instead of startTime
          }),
          Fee.countDocuments({
            student: userId,
            status: 'pending'
          }),
          Notification.countDocuments({
            'recipients.user': userId,
            'recipients.isRead': false,
            status: 'sent'
          })
        ]);

        stats = {
          enrolledBatches,
          myAttendanceRate,
          upcomingStudentExams,
          pendingStudentFees,
          studentNotifications
        };
        break;

      case 'parent':
        // Parent gets statistics for their children
        const parent = await User.findById(userId).populate('children');
        const childrenIds = parent.children.map(child => child._id);

        if (childrenIds.length === 0) {
          stats = {
            myChildren: 0,
            childrenBatches: 0,
            pendingFees: 0,
            upcomingExams: 0,
            parentNotifications: 0
          };
          break;
        }

        const childrenBatches = await Batch.find({
          'students.student': { $in: childrenIds },
          'students.status': 'active'
        }).select('_id');

        const childrenBatchIds = childrenBatches.map(batch => batch._id);

        const [
          myChildren,
          childrenBatchesCount,
          childrenPendingFees,
          childrenUpcomingExams,
          parentNotifications
        ] = await Promise.all([
          childrenIds.length,
          childrenBatchIds.length,
          Fee.countDocuments({
            student: { $in: childrenIds },
            status: 'pending'
          }),
          Exam.countDocuments({
            batch: { $in: childrenBatchIds },
            status: 'active',
            scheduleDate: { $gte: new Date() }  // FIXED: Use scheduleDate instead of startTime
          }),
          Notification.countDocuments({
            'recipients.user': userId,
            'recipients.isRead': false,
            status: 'sent'
          })
        ]);

        stats = {
          myChildren,
          childrenBatches: childrenBatchesCount,
          pendingFees: childrenPendingFees,
          upcomingExams: childrenUpcomingExams,
          parentNotifications
        };
        break;

      default:
        throw new AppError('Invalid user role', 400);
    }

    res.status(200).json({
      success: true,
      data: { stats, role }
    });
  })
);

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities based on user role
// @access  Private (All roles)
router.get('/recent-activities',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { role, _id: userId } = req.user;
    let activities = [];

    const limit = parseInt(req.query.limit) || 10;

    switch (role) {
      case 'admin':
        // Get recent system activities
        const [recentUsers, recentBatches, recentNotifications] = await Promise.all([
          User.find({ role: { $ne: 'admin' } })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('firstName lastName role createdAt'),
          Batch.find({})
            .sort({ createdAt: -1 })
            .limit(3)
            .select('name subject createdAt')
            .populate('teacher', 'firstName lastName'),
          Notification.find({ sender: userId })
            .sort({ createdAt: -1 })
            .limit(4)
            .select('title type createdAt deliveryStats')
        ]);

        activities = [
          ...recentUsers.map(user => ({
            type: 'user_created',
            message: `New ${user.role} ${user.firstName} ${user.lastName} registered`,
            timestamp: user.createdAt
          })),
          ...recentBatches.map(batch => ({
            type: 'batch_created',
            message: `New batch "${batch.name}" created by ${batch.teacher.firstName} ${batch.teacher.lastName}`,
            timestamp: batch.createdAt
          })),
          ...recentNotifications.map(notif => ({
            type: 'notification_sent',
            message: `Notification "${notif.title}" sent to ${notif.deliveryStats.totalRecipients} recipients`,
            timestamp: notif.createdAt
          }))
        ];
        break;

      case 'teacher':
        // Get teacher's recent activities
        const teacherBatches = await Batch.find({
          $or: [{ teacher: userId }, { assistantTeachers: userId }]
        }).select('_id');
        
        const teacherBatchIds = teacherBatches.map(b => b._id);

        const [recentAttendance, recentExams] = await Promise.all([
          Attendance.find({ batch: { $in: teacherBatchIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('batch', 'name')
            .select('batch date students createdAt'),
          Exam.find({ batch: { $in: teacherBatchIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('batch', 'name')
            .select('title batch scheduleDate createdAt')  // FIXED: Use scheduleDate
        ]);

        activities = [
          ...recentAttendance.map(att => ({
            type: 'attendance_marked',
            message: `Attendance marked for ${att.batch.name} - ${att.students.length} students`,
            timestamp: att.createdAt
          })),
          ...recentExams.map(exam => ({
            type: 'exam_scheduled',
            message: `Exam "${exam.title}" scheduled for ${exam.batch.name}`,
            timestamp: exam.createdAt
          }))
        ];
        break;

      case 'student':
        // Get student's recent activities
        const [studentAttendance, studentExams, studentFees] = await Promise.all([
          Attendance.find({
            'students.student': userId
          })
            .sort({ date: -1 })
            .limit(5)
            .populate('batch', 'name')
            .select('batch date students'),
          Exam.find({
            'submissions.student': userId  // FIXED: Use submissions instead of results
          })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('batch', 'name')
            .select('title batch submissions totalMarks createdAt'),  // FIXED: Include totalMarks
          Fee.find({ student: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('amount status dueDate createdAt')
        ]);

        activities = [
          ...studentAttendance.map(att => {
            const myAttendance = att.students.find(s => s.student.equals(userId));
            return {
              type: 'attendance_recorded',
              message: `Attendance: ${myAttendance.status} in ${att.batch.name}`,
              timestamp: att.date
            };
          }),
          ...studentExams.map(exam => {
            const myResult = exam.submissions.find(r => r.student.equals(userId));  // FIXED: Use submissions
            return {
              type: 'exam_result',
              message: `Exam result: ${myResult.totalMarksObtained || 'N/A'}/${exam.totalMarks} in "${exam.title}"`,  // FIXED: Use totalMarksObtained
              timestamp: exam.createdAt
            };
          }),
          ...studentFees.map(fee => ({
            type: 'fee_generated',
            message: `Fee of ₹${fee.amount} - ${fee.status}`,
            timestamp: fee.createdAt
          }))
        ];
        break;

      case 'parent':
        // Get parent's children activities
        const parent = await User.findById(userId).populate('children', 'firstName lastName');
        const childrenIds = parent.children.map(child => child._id);

        if (childrenIds.length === 0) {
          activities = [];
          break;
        }

        const [childrenAttendance, childrenFees] = await Promise.all([
          Attendance.find({
            'students.student': { $in: childrenIds }
          })
            .sort({ date: -1 })
            .limit(5)
            .populate('batch', 'name')
            .select('batch date students'),
          Fee.find({ student: { $in: childrenIds } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'firstName lastName')
            .select('student amount status createdAt')
        ]);

        activities = [
          ...childrenAttendance.map(att => {
            const childAttendances = att.students.filter(s => 
              childrenIds.some(childId => childId.equals(s.student))
            );
            return childAttendances.map(childAtt => {
              const child = parent.children.find(c => c._id.equals(childAtt.student));
              return {
                type: 'child_attendance',
                message: `${child.firstName}: ${childAtt.status} in ${att.batch.name}`,
                timestamp: att.date
              };
            });
          }).flat(),
          ...childrenFees.map(fee => ({
            type: 'child_fee',
            message: `${fee.student.firstName}: Fee ₹${fee.amount} - ${fee.status}`,
            timestamp: fee.createdAt
          }))
        ];
        break;
    }

    // Sort activities by timestamp and limit
    activities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: { activities, role }
    });
  })
);
// Add these routes before the export statement

// @route   GET /api/dashboard/my-children
// @desc    Get parent's children with basic stats
// @access  Private (Parent)
router.get('/my-children',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parent = await User.findById(req.user._id).populate('children', 'firstName lastName email studentId profilePicture');
    const children = parent.children || [];
    
    res.status(200).json({
      success: true,
      data: children
    });
  })
);

// @route   GET /api/dashboard/teacher-stats
// @desc    Get teacher dashboard statistics
// @access  Private (Teacher)
router.get('/teacher-stats',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const teacherId = req.user._id;
    
    // Get total batches
    const totalBatches = await Batch.countDocuments({
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ]
    });
    
    // Get total students
    const batchesWithStudents = await Batch.find({
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ]
    }).select('students');
    
    const totalStudents = batchesWithStudents.reduce((total, batch) => {
      return total + batch.students.filter(s => s.status === 'active').length;
    }, 0);
    
    // Get today's classes
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todaysClasses = await Batch.find({
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ],
      status: 'active'
    }).select('name schedule');
    
    const classesToday = todaysClasses.filter(batch => {
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return batch.schedule && batch.schedule.some(s => 
        s.day && s.day.toLowerCase() === dayOfWeek
      );
    });
    
    // Get attendance taken today
    const attendanceTaken = await Attendance.countDocuments({
      teacher: teacherId,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    
    // Get upcoming exams (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingExams = await Exam.countDocuments({
      batch: {
        $in: await Batch.find({
          $or: [
            { teacher: teacherId },
            { assistantTeachers: teacherId }
          ]
        }).distinct('_id')
      },
      examDate: { $gte: new Date(), $lte: nextWeek }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalBatches,
        totalStudents,
        classesToday: classesToday.length,
        attendanceTaken,
        upcomingExams
      }
    });
  })
);

// @route   GET /api/dashboard/teacher-activities
// @desc    Get teacher recent activities
// @access  Private (Teacher)
router.get('/teacher-activities',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const teacherId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent attendance records
    const recentAttendance = await Attendance.find({
      teacher: teacherId
    })
    .populate('batch', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('batch topic date students');
    
    // Get recent exams
    const recentExams = await Exam.find({
      teacher: teacherId
    })
    .populate('batch', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title batch examDate type status');
    
    // Get recent notifications sent
    const recentNotifications = await Notification.find({
      sender: teacherId
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title type category priority createdAt');
    
    // Format activities
    const activities = [];
    
    recentAttendance.forEach(record => {
      activities.push({
        type: 'attendance',
        title: `Attendance taken for ${record.batch.name}`,
        description: record.topic || 'Regular class',
        timestamp: record.createdAt,
        metadata: { batchName: record.batch.name }
      });
    });
    
    recentExams.forEach(exam => {
      activities.push({
        type: 'exam',
        title: `${exam.type} exam: ${exam.title}`,
        description: `Scheduled for ${exam.batch.name}`,
        timestamp: exam.createdAt,
        metadata: { batchName: exam.batch.name, status: exam.status }
      });
    });
    
    recentNotifications.forEach(notification => {
      activities.push({
        type: 'notification',
        title: notification.title,
        description: `${notification.category} notification sent`,
        timestamp: notification.createdAt,
        metadata: { type: notification.type, priority: notification.priority }
      });
    });
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.status(200).json({
      success: true,
      data: activities.slice(0, limit)
    });
  })
);

// @route   GET /api/dashboard/today-schedule
// @desc    Get today's schedule for teacher
// @access  Private (Teacher)
router.get('/today-schedule',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const teacherId = req.user._id;
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const batches = await Batch.find({
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ],
      status: 'active'
    })
    .populate('teacher', 'firstName lastName')
    .select('name code subject schedule classroom');
    
    // Filter and format today's classes
    const todaySchedule = [];
    
    batches.forEach(batch => {
      if (batch.schedule) {
        batch.schedule.forEach(scheduleItem => {
          if (scheduleItem.day && scheduleItem.day.toLowerCase() === dayOfWeek) {
            todaySchedule.push({
              batchId: batch._id,
              batchName: batch.name,
              batchCode: batch.code,
              subject: batch.subject,
              startTime: scheduleItem.startTime,
              endTime: scheduleItem.endTime,
              classroom: batch.classroom,
              teacher: batch.teacher
            });
          }
        });
      }
    });
    
    // Sort by start time
    todaySchedule.sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
    
    res.status(200).json({
      success: true,
      data: todaySchedule
    });
  })
);

// @route   GET /api/dashboard/upcoming-events
// @desc    Get upcoming events for parent
// @access  Private (Parent)
router.get('/upcoming-events',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parent = await User.findById(req.user._id).populate('children');
    const children = parent.children || [];
    
    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const childIds = children.map(child => child._id);
    
    // Get child batches
    const childBatches = await Batch.find({
      'students.student': { $in: childIds },
      'students.status': 'active'
    }).select('_id');
    
    const batchIds = childBatches.map(batch => batch._id);
    
    // Get upcoming exams
    const upcomingExams = await Exam.find({
      batch: { $in: batchIds },
      examDate: { $gte: new Date() }
    })
    .populate('batch', 'name')
    .sort({ examDate: 1 })
    .limit(10);
    
    // Get upcoming fee due dates
    const upcomingFees = await Fee.find({
      'students.student': { $in: childIds },
      'students.status': { $in: ['pending', 'overdue'] },
      dueDate: { $gte: new Date() }
    })
    .populate('batch', 'name')
    .sort({ dueDate: 1 })
    .limit(10);
    
    // Format events
    const events = [];
    
    upcomingExams.forEach(exam => {
      events.push({
        type: 'exam',
        title: exam.title,
        description: `${exam.type} exam for ${exam.batch.name}`,
        date: exam.examDate,
        batch: exam.batch.name,
        priority: 'high'
      });
    });
    
    upcomingFees.forEach(fee => {
      events.push({
        type: 'fee',
        title: `${fee.type} fee due`,
        description: `Payment due for ${fee.batch.name}`,
        date: fee.dueDate,
        batch: fee.batch.name,
        priority: fee.dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium'
      });
    });
    
    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      success: true,
      data: events
    });
  })
);
// Add to backend/routes/dashboard.js

// @route   GET /api/dashboard/my-children
// @desc    Get parent's children data
// @access  Private (Parent)
router.get('/my-children',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parentId = req.user._id;
    
    const parent = await User.findById(parentId).populate({
      path: 'children',
      select: 'firstName lastName grade studentId email status',
      populate: {
        path: 'batches',
        select: 'name subject teacher',
        populate: {
          path: 'teacher',
          select: 'firstName lastName'
        }
      }
    });
    
    if (!parent || !parent.children) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get additional stats for each child
    const childrenWithStats = await Promise.all(
      parent.children.map(async (child) => {
        // Get recent attendance
        const recentAttendance = await Attendance.find({
          'students.student': child._id
        })
        .limit(5)
        .sort({ date: -1 })
        .populate('batch', 'name');
        
        // Get recent exam results
        const recentExams = await Exam.find({
          'submissions.student': child._id,
          status: 'completed'
        })
        .limit(3)
        .sort({ examDate: -1 })
        .select('title type submissions examDate');
        
        return {
          ...child.toObject(),
          recentAttendance: recentAttendance.map(att => {
            const studentAtt = att.students.find(s => 
              s.student.toString() === child._id.toString()
            );
            return {
              date: att.date,
              status: studentAtt?.status || 'absent',
              batch: att.batch?.name
            };
          }),
          recentExams: recentExams.map(exam => {
            const submission = exam.submissions.find(s => 
              s.student.toString() === child._id.toString()
            );
            return {
              title: exam.title,
              type: exam.type,
              date: exam.examDate,
              score: submission?.percentage || 0,
              grade: submission?.grade || 'N/A'
            };
          })
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: childrenWithStats
    });
  })
);

// @route   GET /api/dashboard/recent-activities
// @desc    Get parent's recent activities
// @access  Private (Parent)
router.get('/recent-activities',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parentId = req.user._id;
    
    // Get parent's children
    const parent = await User.findById(parentId).populate('children');
    const childIds = parent.children.map(child => child._id);
    
    // Get recent activities involving the children
    const recentAttendance = await Attendance.find({
      'students.student': { $in: childIds },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('batch', 'name')
    .populate('students.student', 'firstName lastName')
    .limit(10)
    .sort({ date: -1 });
    
    const recentExams = await Exam.find({
      'submissions.student': { $in: childIds },
      status: 'completed',
      examDate: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    })
    .populate('batch', 'name')
    .populate('submissions.student', 'firstName lastName')
    .limit(5)
    .sort({ examDate: -1 });
    
    // Format activities
    const activities = [];
    
    // Add attendance activities
    recentAttendance.forEach(attendance => {
      attendance.students.forEach(student => {
        if (childIds.some(id => id.equals(student.student._id))) {
          activities.push({
            type: 'attendance',
            message: `${student.student.firstName} ${student.student.lastName} marked ${student.status} for ${attendance.batch.name}`,
            date: attendance.date,
            icon: student.status === 'present' ? 'check' : student.status === 'late' ? 'clock' : 'x'
          });
        }
      });
    });
    
    // Add exam activities
    recentExams.forEach(exam => {
      exam.submissions.forEach(submission => {
        if (childIds.some(id => id.equals(submission.student._id))) {
          activities.push({
            type: 'exam',
            message: `${submission.student.firstName} ${submission.student.lastName} scored ${submission.percentage.toFixed(1)}% in ${exam.title}`,
            date: exam.examDate,
            icon: 'award'
          });
        }
      });
    });
    
    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.status(200).json({
      success: true,
      data: activities.slice(0, 10)
    });
  })
);

// @route   GET /api/dashboard/upcoming-events
// @desc    Get upcoming events for parent's children
// @access  Private (Parent)
router.get('/upcoming-events',
  authenticateToken,
  authorizeRoles('parent'),
  catchAsync(async (req, res) => {
    const parentId = req.user._id;
    
    // Get parent's children
    const parent = await User.findById(parentId).populate('children');
    const childIds = parent.children.map(child => child._id);
    
    // Get batches for the children
    const childBatches = await Batch.find({
      'students.student': { $in: childIds },
      'students.status': 'active'
    });
    
    const batchIds = childBatches.map(batch => batch._id);
    
    // Get upcoming exams
    const upcomingExams = await Exam.find({
      batch: { $in: batchIds },
      examDate: { $gte: new Date() },
      status: { $in: ['published', 'active'] }
    })
    .populate('batch', 'name')
    .sort({ examDate: 1 })
    .limit(10);
    
    // Get fee due dates
    const upcomingFees = await Fee.find({
      student: { $in: childIds },
      status: 'pending',
      dueDate: { $gte: new Date() }
    })
    .populate('student', 'firstName lastName')
    .populate('batch', 'name')
    .sort({ dueDate: 1 })
    .limit(10);
    
    const events = [];
    
    // Add exam events
    upcomingExams.forEach(exam => {
      events.push({
        type: 'exam',
        title: `${exam.title} - ${exam.batch.name}`,
        date: exam.examDate,
        time: exam.startTime,
        icon: 'book'
      });
    });
    
    // Add fee events
    upcomingFees.forEach(fee => {
      events.push({
        type: 'fee',
        title: `Fee Due - ${fee.student.firstName} ${fee.student.lastName}`,
        date: fee.dueDate,
        amount: fee.amount,
        icon: 'dollar-sign'
      });
    });
    
    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      success: true,
      data: events.slice(0, 15)
    });
  })
);
export default router;