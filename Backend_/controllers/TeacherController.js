const UserTeacher = require("../models/User-Teacher");
const UserStudent = require("../models/User-Student");
const CoachingCenter = require("../models/CoachingCenter");
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
    licenseKey, // Added license key
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
    // Validate license key
    if (!licenseKey || licenseKey.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "License key is required",
      });
    }

    // Clean and validate license key format
    const cleanLicenseKey = licenseKey.replace(/-/g, '').toUpperCase();
    if (!/^[A-F0-9]{64}$/.test(cleanLicenseKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid license key format",
      });
    }

    // Find coaching center with this license key
    const coachingCenter = await CoachingCenter.findOne({ licenseKey: cleanLicenseKey });
    if (!coachingCenter) {
      return res.status(400).json({
        success: false,
        message: "Invalid license key. Please contact your coaching center for the correct key.",
      });
    }

    if (coachingCenter.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "This coaching center is not currently active. Please contact support.",
      });
    }

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
    if (!validatePass.valid) {
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
      coachingCenterId: coachingCenter._id, // Link to the coaching center
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

// Create New Batch
const createBatch = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchName, subject, schedule, studentIds } = req.body;

    if (!batchName || !subject) {
      return res.status(400).json({
        success: false,
        message: "Batch name and subject are required"
      });
    }

    // Verify teacher exists
    const teacher = await UserTeacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // If student IDs are provided, verify they exist
    let students = [];
    if (studentIds && studentIds.length > 0) {
      students = await UserStudent.find({ _id: { $in: studentIds } });
      if (students.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some students not found"
        });
      }
    }

    const newBatch = new Batch({
      batchName,
      subject,
      teacher: teacherId,
      students: studentIds || [],
      schedule: schedule || {
        days: [],
        startTime: "",
        endTime: ""
      },
      status: "active"
    });

    await newBatch.save();

    // Populate the response with teacher and student details
    const populatedBatch = await Batch.findById(newBatch._id)
      .populate('teacher', 'name email')
      .populate('students', 'name contact.email class');

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch: populatedBatch
    });
  } catch (error) {
    console.error("Create batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create batch",
      error: error.message
    });
  }
};

// Update Batch
const updateBatch = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId } = req.params;
    const { batchName, subject, schedule, studentIds, status } = req.body;

    // Find the batch and verify it belongs to the teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: teacherId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or not authorized"
      });
    }

    // Update fields if provided
    if (batchName) batch.batchName = batchName;
    if (subject) batch.subject = subject;
    if (schedule) batch.schedule = schedule;
    if (status) batch.status = status;
    
    if (studentIds !== undefined) {
      // Verify students exist if studentIds are provided
      if (studentIds.length > 0) {
        const students = await UserStudent.find({ _id: { $in: studentIds } });
        if (students.length !== studentIds.length) {
          return res.status(400).json({
            success: false,
            message: "Some students not found"
          });
        }
      }
      batch.students = studentIds;
    }

    await batch.save();

    // Populate the response
    const updatedBatch = await Batch.findById(batch._id)
      .populate('teacher', 'name email')
      .populate('students', 'name contact.email class');

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch: updatedBatch
    });
  } catch (error) {
    console.error("Update batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update batch",
      error: error.message
    });
  }
};

// Get Teacher's Students from all batches
const getTeacherStudents = async (req, res) => {
  try {
    console.log("🔍 getTeacherStudents called for teacher:", req.user.id);
    const teacherId = req.user.id;
    
    // Get teacher's batches with students
    const batches = await Batch.find({ teacher: teacherId })
      .populate('students', 'name contact.email contact.phone class currSchool dateOfJoining academicPerformance status')
      .lean();

    console.log("📦 Found batches:", batches.length);

    // Extract all unique students from batches
    const studentMap = new Map();
    const batchMap = new Map();
    
    batches.forEach(batch => {
      batchMap.set(batch._id.toString(), {
        id: batch._id,
        name: batch.batchName,
        subject: batch.subject
      });
      
      batch.students.forEach(student => {
        if (!studentMap.has(student._id.toString())) {
          studentMap.set(student._id.toString(), {
            ...student,
            batches: []
          });
        }
        studentMap.get(student._id.toString()).batches.push({
          id: batch._id,
          name: batch.batchName,
          subject: batch.subject
        });
      });
    });

    // Convert map to array and format data
    const studentsData = Array.from(studentMap.values()).map(student => {
      // Calculate attendance and average score from academic performance
      let attendance = 0;
      let avgScore = 0;
      
      if (student.academicPerformance && student.academicPerformance.subjects) {
        const subjects = student.academicPerformance.subjects;
        if (subjects.length > 0) {
          avgScore = subjects.reduce((sum, subject) => sum + (subject.score || 0), 0) / subjects.length;
        }
        attendance = student.academicPerformance.attendancePercentage || 0;
      }

      return {
        id: student._id,
        name: student.name,
        email: student.contact?.email || '',
        phone: student.contact?.phone || '',
        class: student.class || '',
        school: student.currSchool || '',
        dateOfJoining: student.dateOfJoining,
        status: student.status || 'active',
        batches: student.batches,
        attendance: Math.round(attendance),
        avgScore: Math.round(avgScore),
        rollNo: student._id.toString().slice(-6).toUpperCase() // Generate roll number from ID
      };
    });

    res.status(200).json({
      success: true,
      students: studentsData,
      total: studentsData.length,
      batches: Array.from(batchMap.values())
    });
  } catch (error) {
    console.error("Get teacher students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message
    });
  }
};

// Delete Batch
const deleteBatch = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId } = req.params;

    // Find the batch and verify it belongs to the teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: teacherId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or not authorized"
      });
    }

    // Check if there are any attendance records for this batch
    const attendanceCount = await Attendance.countDocuments({ batch: batchId });
    if (attendanceCount > 0) {
      // Instead of deleting, mark as inactive
      batch.status = "inactive";
      await batch.save();
      
      return res.status(200).json({
        success: true,
        message: "Batch marked as inactive due to existing attendance records"
      });
    }

    // If no attendance records, safe to delete
    await Batch.findByIdAndDelete(batchId);

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully"
    });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete batch",
      error: error.message
    });
  }
};

// Get Marks for a Batch and Subject
const getMarks = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId, subject, examType } = req.query;

    if (!batchId || !subject) {
      return res.status(400).json({
        success: false,
        message: "Batch ID and subject are required"
      });
    }

    // Verify batch belongs to teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: teacherId })
      .populate('students', 'name contact.email class');
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or not authorized"
      });
    }

    // Get existing marks for this batch, subject, and exam type
    const marks = await UserStudent.find({ 
      _id: { $in: batch.students.map(s => s._id) } 
    }).select('name contact.email class academicPerformance');

    const marksData = marks.map(student => {
      const studentMarks = student.academicPerformance?.subjects?.find(
        sub => sub.name.toLowerCase() === subject.toLowerCase()
      );
      
      const examMark = studentMarks?.exams?.find(
        exam => exam.type === examType
      );

      return {
        studentId: student._id,
        name: student.name,
        email: student.contact?.email,
        class: student.class,
        rollNo: `2025${student._id.toString().slice(-3)}`, // Generate roll number
        currentMark: examMark?.score || null,
        maxMarks: examMark?.maxMarks || 100
      };
    });

    res.status(200).json({
      success: true,
      marks: marksData,
      batch: {
        id: batch._id,
        name: batch.batchName,
        subject: batch.subject
      }
    });
  } catch (error) {
    console.error("Get marks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch marks",
      error: error.message
    });
  }
};

// Save Marks
const saveMarks = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId, subject, examType, examName, maxMarks, marks } = req.body;

    if (!batchId || !subject || !examType || !marks || !Array.isArray(marks)) {
      return res.status(400).json({
        success: false,
        message: "Batch ID, subject, exam type, and marks array are required"
      });
    }

    // Verify batch belongs to teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: teacherId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or not authorized"
      });
    }

    // Process marks for each student
    const updatePromises = marks.map(async (markData) => {
      const { studentId, mark } = markData;
      
      if (!studentId || (mark === null || mark === undefined || mark === '')) {
        return; // Skip if no mark provided
      }

      const student = await UserStudent.findById(studentId);
      if (!student) return;

      // Initialize academic performance if not exists
      if (!student.academicPerformance) {
        student.academicPerformance = { subjects: [] };
      }
      if (!student.academicPerformance.subjects) {
        student.academicPerformance.subjects = [];
      }

      // Find or create subject
      let subjectData = student.academicPerformance.subjects.find(
        sub => sub.name.toLowerCase() === subject.toLowerCase()
      );
      
      if (!subjectData) {
        subjectData = {
          name: subject,
          score: 0,
          grade: 'F',
          semester: 'Current',
          year: new Date().getFullYear().toString(),
          exams: []
        };
        student.academicPerformance.subjects.push(subjectData);
      }

      if (!subjectData.exams) {
        subjectData.exams = [];
      }

      // Find or create exam entry
      let examEntry = subjectData.exams.find(exam => exam.type === examType);
      if (!examEntry) {
        examEntry = {
          type: examType,
          name: examName || examType,
          score: 0,
          maxMarks: maxMarks || 100,
          date: new Date()
        };
        subjectData.exams.push(examEntry);
      }

      // Update exam score
      if (mark === 'Absent' || mark === 'absent') {
        examEntry.score = 0;
        examEntry.status = 'Absent';
      } else {
        examEntry.score = parseFloat(mark);
        examEntry.status = 'Present';
      }
      examEntry.maxMarks = maxMarks || 100;
      examEntry.date = new Date();

      // Calculate average score for the subject
      const validExams = subjectData.exams.filter(exam => exam.status !== 'Absent');
      if (validExams.length > 0) {
        const totalScore = validExams.reduce((sum, exam) => sum + exam.score, 0);
        const totalMaxMarks = validExams.reduce((sum, exam) => sum + exam.maxMarks, 0);
        subjectData.score = Math.round((totalScore / totalMaxMarks) * 100);
        
        // Calculate grade
        if (subjectData.score >= 90) subjectData.grade = 'A+';
        else if (subjectData.score >= 80) subjectData.grade = 'A';
        else if (subjectData.score >= 70) subjectData.grade = 'B+';
        else if (subjectData.score >= 60) subjectData.grade = 'B';
        else if (subjectData.score >= 50) subjectData.grade = 'C';
        else subjectData.grade = 'F';
      }

      await student.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Marks saved successfully for ${marks.filter(m => m.mark !== null && m.mark !== undefined && m.mark !== '').length} students`
    });
  } catch (error) {
    console.error("Save marks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save marks",
      error: error.message
    });
  }
};

// Get Batch Join Requests for Teacher
const getBatchJoinRequests = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const batches = await Batch.find({ teacher: teacherId })
      .populate({
        path: 'joinRequests.student',
        select: 'name contact.email class currSchool'
      })
      .lean();

    const allRequests = [];
    batches.forEach(batch => {
      if (batch.joinRequests && batch.joinRequests.length > 0) {
        batch.joinRequests.forEach(request => {
          allRequests.push({
            requestId: request._id,
            batchId: batch._id,
            batchName: batch.batchName,
            subject: batch.subject,
            student: request.student,
            message: request.message,
            requestDate: request.requestDate,
            status: request.status,
            responseDate: request.responseDate,
            responseMessage: request.responseMessage
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      requests: allRequests
    });
  } catch (error) {
    console.error("Get join requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch join requests",
      error: error.message
    });
  }
};

// Approve or Reject Batch Join Request
const handleJoinRequest = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { batchId, requestId, action, responseMessage } = req.body;

    if (!batchId || !requestId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Batch ID, request ID, and valid action (approve/reject) are required"
      });
    }

    // Find the batch and verify it belongs to the teacher
    const batch = await Batch.findOne({ _id: batchId, teacher: teacherId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or not authorized"
      });
    }

    // Find the join request
    const joinRequest = batch.joinRequests.id(requestId);
    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: "Join request not found"
      });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed"
      });
    }

    // Update the request status
    joinRequest.status = action === 'approve' ? 'approved' : 'rejected';
    joinRequest.responseDate = new Date();
    joinRequest.responseMessage = responseMessage || '';

    // If approved, add student to the batch
    if (action === 'approve') {
      if (!batch.students.includes(joinRequest.student)) {
        batch.students.push(joinRequest.student);
      }
    }

    await batch.save();

    res.status(200).json({
      success: true,
      message: `Join request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error("Handle join request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process join request",
      error: error.message
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
  getTeacherStudents,
  markAttendance,
  teacherCheckInOut,
  manageTask,
  getTeacherTasks,
  createBatch,
  updateBatch,
  deleteBatch,
  getMarks,
  saveMarks,
  getBatchJoinRequests,
  handleJoinRequest
};
