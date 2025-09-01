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

// @route   GET /api/teachers/profile
// @desc    Get current teacher's profile
// @access  Private (Teacher)
router.get('/profile',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const teacher = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    res.status(200).json({
      success: true,
      data: teacher
    });
  })
);

// @route   PUT /api/teachers/profile
// @desc    Update teacher profile
// @access  Private (Teacher)
router.put('/profile',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const allowedFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'address',
      'subjects',
      'qualifications',
      'experience'
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const teacher = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    res.status(200).json({
      success: true,
      data: teacher
    });
  })
);

// @route   GET /api/teachers/dashboard
// @desc    Get teacher dashboard data
// @access  Private (Teacher)
router.get('/dashboard',
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
    
    // Get total students across all batches
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
    
    // Filter classes happening today based on schedule
    const classesToday = todaysClasses.filter(batch => {
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return batch.schedule && batch.schedule.some(s => 
        s.day && s.day.toLowerCase() === dayOfWeek
      );
    });
    
    // Get pending attendance (classes where attendance not taken today)
    const attendanceTaken = await Attendance.find({
      teacher: teacherId,
      date: {
        $gte: todayStart,
        $lte: todayEnd
      }
    }).select('batch');
    
    const attendanceTakenBatches = attendanceTaken.map(a => a.batch.toString());
    const pendingAttendance = classesToday.filter(batch => 
      !attendanceTakenBatches.includes(batch._id.toString())
    );
    
    // Get upcoming exams (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingExams = await Exam.find({
      batch: {
        $in: await Batch.find({
          $or: [
            { teacher: teacherId },
            { assistantTeachers: teacherId }
          ]
        }).distinct('_id')
      },
      examDate: { $gte: new Date(), $lte: nextWeek }
    })
    .populate('batch', 'name')
    .sort({ examDate: 1 });
    
    // Get recent notifications
    const notifications = await Notification.find({
      $or: [
        { 'recipients.user': teacherId },
        { targetAudience: 'all' },
        { targetAudience: 'teachers' }
      ],
      isRead: { $nin: [teacherId] }
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBatches,
          totalStudents,
          classesToday: classesToday.length,
          pendingAttendance: pendingAttendance.length,
          upcomingExams: upcomingExams.length
        },
        todaysClasses: classesToday,
        pendingAttendance,
        upcomingExams,
        recentNotifications: notifications
      }
    });
  })
);

// @route   GET /api/teachers/students
// @desc    Get all students for teacher's batches
// @access  Private (Teacher)
router.get('/students',
  authenticateToken,
  authorizeRoles('teacher'),
  catchAsync(async (req, res) => {
    const { page = 1, limit = 20, batchId, search } = req.query;
    const teacherId = req.user._id;
    
    let batchQuery = {
      $or: [
        { teacher: teacherId },
        { assistantTeachers: teacherId }
      ]
    };
    
    if (batchId) {
      batchQuery._id = batchId;
    }
    
    const batches = await Batch.find(batchQuery)
      .populate({
        path: 'students.student',
        match: search ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } }
          ]
        } : {},
        select: 'firstName lastName email studentId phoneNumber profilePicture'
      })
      .select('name code students');
    
    // Flatten and format student data
    const allStudents = [];
    batches.forEach(batch => {
      batch.students.forEach(studentEntry => {
        if (studentEntry.student && studentEntry.status === 'active') {
          allStudents.push({
            ...studentEntry.student.toObject(),
            batch: {
              _id: batch._id,
              name: batch.name,
              code: batch.code
            },
            enrollmentDate: studentEntry.enrollmentDate,
            status: studentEntry.status
          });
        }
      });
    });
    
    // Remove duplicates (student can be in multiple batches)
    const uniqueStudents = allStudents.reduce((acc, student) => {
      const existing = acc.find(s => s._id.toString() === student._id.toString());
      if (!existing) {
        acc.push({
          ...student,
          batches: [student.batch]
        });
      } else {
        existing.batches.push(student.batch);
      }
      return acc;
    }, []);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedStudents = uniqueStudents.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: paginatedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: uniqueStudents.length,
        pages: Math.ceil(uniqueStudents.length / limit)
      }
    });
  })
);

export default router;