const UserTeacher = require("../models/User-Teacher");
const UserStudent = require("../models/User-Student");
const { Batch, Attendance, Task, TeacherAttendance } = require("../models/TeacherDashboard");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { sendTeacherWelcomeEmail, generateVerificationToken, sendTeacherVerificationEmail, generatePasswordResetToken, sendTeacherPasswordResetEmail } = require("../config/emailService");

const TeacherRegister = async (req, res) => {
  console.log("Response from app.js: ", req.body);

  const {
    name,
    email,
    phone,
    profilePicture,
    password,
    role,
    organization,
    qualifications,
    specialization,
    experience,
    teacherId,
    assignedClasses,
  } = req.body;

  function validatePassword(password) {
    const minLength = 8;
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$&!%*?])[A-Za-z\d@$&!%*?]{8,}$/;

    if (password.length <= minLength) {
      return {
        valid: false,
        message: "Password must me atleast 8 charatctes long",
      };
    }

    if (!regex.test(password)) {
      return {
        valid: false,
        message:
          "Password must include uppercase, lowercase, number, and special character.",
      };
    }
    return { valid: true };
  }

  try {
    // Check if user exist or not
    const IsUserExist = await UserTeacher.findOne({ email });
    if (IsUserExist) {
      return res.status(403).json({
        success: false,
        message: "User already exists",
      });
    }

    // Validate Password
    const validatePass = validatePassword(password);
    if (!validatePass) {
      return res.status(400).json({
        success: false,
        message: validatePass?.message,
      });
    }

    // Hash form password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const photoUrl = req.file ? req.file.path : null;

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUserTeacher = new UserTeacher({
      name,
      phone,
      email,
      profilePicture: photoUrl,
      password: hashPassword,
      role,
      organization,
      qualifications,
      specialization,
      experience,
      teacherId,
      assignedClasses,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    await newUserTeacher.save();

    // Send verification email
    try {
      await sendTeacherVerificationEmail(name, email, verificationToken);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: "Teacher registration initiated! Please check your email and click the verification link to complete your registration.",
      user: {
        name,
        email,
        role,
        isEmailVerified: false
      },
    });
  } catch (error) {
    console.log("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

const TeacherLogin = async (req, res) => {
  console.log("Teacher login data received:", req.body);
  const { email, password } = req.body;
  try {
    // Check for the User
    const IsUserExist = await UserTeacher.findOne({ email });
    if (!IsUserExist) {
      return res.status(403).json({
        success: false,
        message: "User does not exist",
      });
    }

    // Check if email is verified
    if (!IsUserExist.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email address before logging in. Check your email for verification link.",
      });
    }

    // Compare Password Hash to Original
    const OrgPassword = await bcrypt.compare(password, IsUserExist.password);
    if (!OrgPassword) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password",
      });
    }

    const token = jwt.sign(
      {
        id: IsUserExist._id,
        email: IsUserExist.email,
        name: IsUserExist.name,
        role: IsUserExist.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        id: IsUserExist._id,
        name: IsUserExist.name,
        email: IsUserExist.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const TeacherProfile = async (req, res) => {
  try {
    const teacher = await UserTeacher.findById(req.user.id).select(
      "-password"
    );
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

// Get Teacher Dashboard Data
const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher basic info
    const teacher = await UserTeacher.findById(teacherId).select("-password");
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // Get teacher's batches
    const batches = await Batch.find({ teacher: teacherId })
      .populate('students', 'name contact.email class')
      .lean();

    // Get today's attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      teacher: teacherId,
      date: { $gte: today, $lt: tomorrow }
    }).populate('batch', 'batchName subject');

    // Get teacher's tasks
    const tasks = await Task.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get teacher attendance for today
    const teacherAttendance = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Calculate statistics
    const totalStudents = batches.reduce((total, batch) => total + batch.students.length, 0);
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalTasks = tasks.length;
    const attendanceMarked = todayAttendance.length;

    const dashboardData = {
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        organization: teacher.organization,
        qualifications: teacher.qualifications,
        specialization: teacher.specialization,
        experience: teacher.experience,
      },
      statistics: {
        totalBatches: batches.length,
        totalStudents,
        completedTasks,
        totalTasks,
        attendanceMarked,
        isCheckedIn: teacherAttendance?.status === 'checked-in',
      },
      batches: batches.map(batch => ({
        id: batch._id,
        batchName: batch.batchName,
        subject: batch.subject,
        studentCount: batch.students.length,
        schedule: batch.schedule,
        status: batch.status,
      })),
      recentTasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        category: task.category,
        createdAt: task.createdAt,
      })),
      todayAttendance: todayAttendance.map(attendance => ({
        id: attendance._id,
        batch: attendance.batch,
        subject: attendance.subject,
        totalStudents: attendance.totalStudents,
        presentCount: attendance.presentCount,
        absentCount: attendance.absentCount,
        date: attendance.date,
      })),
      teacherAttendance: teacherAttendance ? {
        checkIn: teacherAttendance.checkIn?.time,
        checkOut: teacherAttendance.checkOut?.time,
        status: teacherAttendance.status,
        totalHours: teacherAttendance.totalHours,
      } : null,
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get Teacher's Batches with Students
const getTeacherBatches = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const batches = await Batch.find({ teacher: teacherId })
      .populate('students', 'name contact.email class currSchool')
      .lean();

    res.status(200).json({
      success: true,
      batches: batches,
    });
  } catch (error) {
    console.error("Batches fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
      error: error.message,
    });
  }
};

// Mark Student Attendance
const markAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId, subject, attendanceRecords } = req.body;

    if (!batchId || !subject || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        success: false,
        message: "Batch ID, subject, and attendance records are required"
      });
    }

    // Verify batch belongs to teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: teacherId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or not assigned to you"
      });
    }

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let attendance = await Attendance.findOne({
      batch: batchId,
      teacher: teacherId,
      subject: subject,
      date: { $gte: today, $lt: tomorrow }
    });

    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;

    if (attendance) {
      // Update existing attendance
      attendance.attendanceRecords = attendanceRecords;
      attendance.totalStudents = attendanceRecords.length;
      attendance.presentCount = presentCount;
      attendance.absentCount = absentCount;
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        batch: batchId,
        teacher: teacherId,
        subject: subject,
        attendanceRecords: attendanceRecords,
        totalStudents: attendanceRecords.length,
        presentCount: presentCount,
        absentCount: absentCount,
      });
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      attendance: attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

// Teacher Check-in/Check-out
const teacherCheckInOut = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { action, customTime } = req.body; // action: 'checkin' or 'checkout'

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let teacherAttendance = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: { $gte: today, $lt: tomorrow }
    });

    const currentTime = customTime ? new Date(customTime) : new Date();

    if (!teacherAttendance) {
      teacherAttendance = new TeacherAttendance({
        teacher: teacherId,
        date: today,
      });
    }

    if (action === 'checkin') {
      if (teacherAttendance.status === 'checked-in') {
        return res.status(400).json({
          success: false,
          message: "Already checked in for today"
        });
      }

      teacherAttendance.checkIn = {
        time: currentTime,
        method: customTime ? 'manual' : 'automatic'
      };
      teacherAttendance.status = 'checked-in';
    } else if (action === 'checkout') {
      if (teacherAttendance.status !== 'checked-in') {
        return res.status(400).json({
          success: false,
          message: "Must check in before checking out"
        });
      }

      teacherAttendance.checkOut = {
        time: currentTime,
        method: customTime ? 'manual' : 'automatic'
      };
      teacherAttendance.status = 'checked-out';

      // Calculate total hours
      if (teacherAttendance.checkIn.time) {
        const hours = (currentTime - teacherAttendance.checkIn.time) / (1000 * 60 * 60);
        teacherAttendance.totalHours = Math.round(hours * 100) / 100;
      }
    }

    await teacherAttendance.save();

    res.status(200).json({
      success: true,
      message: `Successfully ${action === 'checkin' ? 'checked in' : 'checked out'}`,
      attendance: teacherAttendance,
    });
  } catch (error) {
    console.error("Teacher check-in/out error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process check-in/out",
      error: error.message,
    });
  }
};

// Create/Update Task
const manageTask = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { taskId, title, description, priority, dueDate, category, status } = req.body;

    let task;

    if (taskId) {
      // Update existing task
      task = await Task.findOne({ _id: taskId, teacher: teacherId });
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found"
        });
      }

      // Only update fields that are provided
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (category) task.category = category;
      
      if (status) {
        task.status = status;
        if (status === 'completed' && !task.completedAt) {
          task.completedAt = new Date();
        } else if (status !== 'completed') {
          task.completedAt = null;
        }
      }
    } else {
      // Create new task - title is required for new tasks
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Task title is required"
        });
      }

      task = new Task({
        teacher: teacherId,
        title,
        description,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        category: category || 'other',
      });
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: taskId ? "Task updated successfully" : "Task created successfully",
      task: task,
    });
  } catch (error) {
    console.error("Task management error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to manage task",
      error: error.message,
    });
  }
};

// Get Teacher Tasks
const getTeacherTasks = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status, priority, category, limit = 20 } = req.query;

    const query = { teacher: teacherId };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const taskStats = {
      total: await Task.countDocuments({ teacher: teacherId }),
      completed: await Task.countDocuments({ teacher: teacherId, status: 'completed' }),
      pending: await Task.countDocuments({ teacher: teacherId, status: 'pending' }),
      inProgress: await Task.countDocuments({ teacher: teacherId, status: 'in-progress' }),
    };

    res.status(200).json({
      success: true,
      tasks: tasks,
      statistics: taskStats,
    });
  } catch (error) {
    console.error("Tasks fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// Forgot Password
const TeacherForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if teacher exists
    const teacher = await UserTeacher.findOne({ email });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }

    // Check if email is verified
    if (!teacher.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email address first before resetting password"
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    teacher.passwordResetToken = resetToken;
    teacher.passwordResetExpires = resetExpires;
    await teacher.save();

    // Send password reset email
    try {
      await sendTeacherPasswordResetEmail(teacher.name, teacher.email, resetToken);
      console.log(`Password reset email sent to: ${teacher.email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email"
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email address"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reset Password
const TeacherResetPassword = async (req, res) => {
  try {
    const { token, email, newPassword, confirmPassword } = req.body;

    if (!token || !email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Validate new password
    function validatePassword(password) {
      const minLength = 8;
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$&!%*?])[A-Za-z\d@$&!%*?]{8,}$/;

      if (password.length < minLength) {
        return {
          valid: false,
          message: "Password must be at least 8 characters long",
        };
      }

      if (!regex.test(password)) {
        return {
          valid: false,
          message: "Password must include uppercase, lowercase, number, and special character.",
        };
      }
      return { valid: true };
    }

    const validatePass = validatePassword(newPassword);
    if (!validatePass.valid) {
      return res.status(400).json({
        success: false,
        message: validatePass.message
      });
    }

    // Find teacher with valid reset token
    const teacher = await UserTeacher.findOne({
      email: email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset tokens
    teacher.password = hashPassword;
    teacher.passwordResetToken = undefined;
    teacher.passwordResetExpires = undefined;
    await teacher.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = { 
  TeacherRegister, 
  TeacherLogin, 
  TeacherProfile, 
  TeacherForgotPassword, 
  TeacherResetPassword,
  getTeacherDashboard,
  getTeacherBatches,
  markAttendance,
  teacherCheckInOut,
  manageTask,
  getTeacherTasks
};
