const UserStudent = require("../models/User-Student");
const CoachingCenter = require("../models/CoachingCenter");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { sendStudentWelcomeEmail, generateVerificationToken, sendStudentVerificationEmail, generatePasswordResetToken, sendStudentPasswordResetEmail } = require("../config/emailService");

const StudentRegister = async (req, res) => {
  console.log("Student registration data received:", req.body);
  const {
    // Personal Info
    role,
    name,
    email,
    phone,
    dateOfJoining,
    profilePicture,
    bloodGroup,
    licenseKey, // Added license key
    // Academic Info
    class: studentClass,
    schoolName,
    lastSchoolAttended,
    // Family Info
    fatherName,
    motherName,
    guardianPhone,
    // Document & Address Info
    aadharNumber,
    aadharDocument,
    completeAddress,
    // Password Info
    password,
    confirmPassword
  } = req.body;

  function validatePassword(password) {
    const minLength = 8;
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!password || password.length < minLength) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long",
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

    // Validate email is not empty
    if (!email || email.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email is required and cannot be empty",
      });
    }

    // Check if user already exists
    const existingUser = await UserStudent.findOne({ 'contact.email': email.trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const validatePass = validatePassword(password);
    if (!validatePass.valid) {
      return res.status(400).json({
        success: false,
        error: validatePass.message,
      });
    }

    // Password match or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password don't match at all",
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // get uploaded file URLs from Cloudinary
    const photoUrl = req.files?.profilePicture ? req.files.profilePicture[0].path : null;
    const aadharUrl = req.files?.aadharDocument
      ? req.files.aadharDocument[0].path
      : null;

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save new user
    const newStudent = new UserStudent({
      role,
      name,
      bloodGroup,
      profilePic: photoUrl,
      coachingCenterId: coachingCenter._id, // Link to the coaching center

      contact: {
        email: email.trim(),
        phone,
        parentPhone: guardianPhone,
      },
      
      dateOfJoining: new Date(dateOfJoining),
      class: studentClass,
      currSchool: schoolName,
      lastSchool: lastSchoolAttended,

      parents: {
        father: fatherName,
        mother: motherName,
      },

      aadhar: {
        number: aadharNumber,
        url: aadharUrl,
      },

      address: completeAddress,
      password: hashPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    await newStudent.save();

    // Send verification email to student
    try {
      await sendStudentVerificationEmail(name, email, verificationToken);
      console.log(`Verification email sent to student: ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the registration if email fails
    }

    res.status(200).json({
      success: true,
      message: "Student registration complete.",
      user: {
        name,
        email: email.trim(),
        role,
        isEmailVerified: false
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A student with this ${field.includes('email') ? 'email' : field} already exists`,
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const StudentLogin = async (req, res) => {
  console.log("Student login data received:", req.body);
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  
  try {
    // Check for the User and explicitly select password field
    const IsUserExist = await UserStudent.findOne({ 'contact.email': email.trim() }).select('+password');
    if (!IsUserExist) {
      return res.status(403).json({
        success: false,
        message: "User does not exist",
      });
    }

    // Check if password exists in the document
    if (!IsUserExist.password) {
      console.error('Password not found in user document for email:', email);
      return res.status(500).json({
        success: false,
        message: "Account data corrupted. Please contact support.",
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
    let OrgPassword;
    try {
      OrgPassword = await bcrypt.compare(password, IsUserExist.password);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(500).json({
        success: false,
        message: "Authentication error. Please try again.",
      });
    }
    
    if (!OrgPassword) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password",
      });
    }

    const token = jwt.sign(
      {
        id: IsUserExist._id,
        email: IsUserExist.contact.email,
        name: IsUserExist.name,
        role: 'student'
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
        email: IsUserExist.contact.email,
        role: 'student'
      },
      token,
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Login failed'
    });
  }
};

const StudentProfile = async (req, res) => {
  try {
    const student = await UserStudent.findById(req.user.id).select(
      "-password -emailVerificationToken -passwordResetToken"
    );
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Transform data to match frontend expectations
    const profileData = {
      name: student.name,
      email: student.contact?.email,
      phone: student.contact?.phone,
      guardianPhone: student.contact?.parentPhone,
      bloodGroup: student.bloodGroup,
      photo: student.profilePic,
      dateOfJoining: student.dateOfJoining,
      class: student.class,
      schoolName: student.currSchool,
      lastSchoolAttended: student.lastSchool,
      fatherName: student.parents?.father,
      motherName: student.parents?.mother,
      aadharNumber: student.aadhar?.number,
      completeAddress: student.address,
      status: student.status || "Active",
      // Academic Performance - use real data if available, otherwise return empty structure
      academicPerformance: student.academicPerformance && student.academicPerformance.subjects && student.academicPerformance.subjects.length > 0 
        ? student.academicPerformance 
        : {
            subjects: [],
            overallGPA: 0,
            overallPercentage: 0,
            rank: 0,
            totalStudents: 0
          }
    };

    res.json({ 
      success: true, 
      student: profileData 
    });
  } catch (err) {
    console.error("Student profile error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch profile'
    });
  }
};

// Forgot Password
const StudentForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if student exists
    const student = await UserStudent.findOne({ 'contact.email': email });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }

    // Check if email is verified
    if (!student.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email address first before resetting password"
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    student.passwordResetToken = resetToken;
    student.passwordResetExpires = resetExpires;
    await student.save();

    // Send password reset email
    try {
      await sendStudentPasswordResetEmail(student.name, student.contact.email, resetToken);
      console.log(`Password reset email sent to: ${student.contact.email}`);
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
const StudentResetPassword = async (req, res) => {
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
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!password || password.length < minLength) {
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

    // Find student with valid reset token
    const student = await UserStudent.findOne({
      'contact.email': email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset tokens
    student.password = hashPassword;
    student.passwordResetToken = undefined;
    student.passwordResetExpires = undefined;
    await student.save();

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

const StudentUpdateProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      name,
      phone,
      bloodGroup,
      class: studentClass,
      schoolName,
      lastSchoolAttended,
      fatherName,
      motherName,
      guardianPhone,
      completeAddress
    } = req.body;

    // Get uploaded file URL from Cloudinary (if new profile picture is uploaded)
    const photoUrl = req.files?.profilePicture ? req.files.profilePicture[0].path : undefined;

    // Find the student
    const student = await UserStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Update fields only if they are provided
    if (name) student.name = name;
    if (phone) student.contact.phone = phone;
    if (bloodGroup) student.bloodGroup = bloodGroup;
    if (studentClass) student.class = studentClass;
    if (schoolName) student.currSchool = schoolName;
    if (lastSchoolAttended) student.lastSchool = lastSchoolAttended;
    if (fatherName) student.parents.father = fatherName;
    if (motherName) student.parents.mother = motherName;
    if (guardianPhone) student.contact.parentPhone = guardianPhone;
    if (completeAddress) student.address = completeAddress;
    if (photoUrl) student.profilePic = photoUrl;

    await student.save();

    // Return updated profile data
    const updatedProfileData = {
      name: student.name,
      email: student.contact?.email,
      phone: student.contact?.phone,
      guardianPhone: student.contact?.parentPhone,
      bloodGroup: student.bloodGroup,
      photo: student.profilePic,
      dateOfJoining: student.dateOfJoining,
      class: student.class,
      schoolName: student.currSchool,
      lastSchoolAttended: student.lastSchool,
      fatherName: student.parents?.father,
      motherName: student.parents?.mother,
      aadharNumber: student.aadhar?.number,
      completeAddress: student.address,
      status: student.status || "Active"
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      student: updatedProfileData
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update profile'
    });
  }
};

// Update Academic Performance (for admins/teachers)
const UpdateAcademicPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjects, overallGPA, overallPercentage, rank, totalStudents, semester, year } = req.body;

    // Find the student
    const student = await UserStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Initialize academic performance if it doesn't exist
    if (!student.academicPerformance) {
      student.academicPerformance = {
        subjects: [],
        overallGPA: 0,
        overallPercentage: 0,
        rank: 0,
        totalStudents: 0
      };
    }

    // Update academic performance
    if (subjects) {
      // Add semester and year to each subject if provided
      const updatedSubjects = subjects.map(subject => ({
        ...subject,
        semester: semester || subject.semester || 'Current',
        year: year || subject.year || new Date().getFullYear().toString(),
        updatedAt: new Date()
      }));
      student.academicPerformance.subjects = updatedSubjects;
    }
    
    if (overallGPA !== undefined) student.academicPerformance.overallGPA = overallGPA;
    if (overallPercentage !== undefined) student.academicPerformance.overallPercentage = overallPercentage;
    if (rank !== undefined) student.academicPerformance.rank = rank;
    if (totalStudents !== undefined) student.academicPerformance.totalStudents = totalStudents;

    student.academicPerformance.lastUpdated = new Date();
    await student.save();

    res.status(200).json({
      success: true,
      message: "Academic performance updated successfully",
      academicPerformance: student.academicPerformance
    });
  } catch (error) {
    console.error("Update academic performance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update academic performance'
    });
  }
};

// Get Available Batches for Students to Join
const getAvailableBatches = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { Batch } = require("../models/TeacherDashboard");
    
    // Get all active batches
    const allBatches = await Batch.find({ status: 'active' })
      .populate('teacher', 'name email organization')
      .populate('students', '_id')
      .lean();

    // Filter out batches the student is already in
    const availableBatches = allBatches.filter(batch => 
      !batch.students.some(student => student._id.toString() === studentId)
    );

    const batchesWithDetails = availableBatches.map(batch => ({
      id: batch._id,
      batchName: batch.batchName,
      subject: batch.subject,
      teacher: {
        name: batch.teacher.name,
        organization: batch.teacher.organization
      },
      schedule: batch.schedule,
      studentsCount: batch.students.length,
      status: batch.status
    }));

    res.status(200).json({
      success: true,
      batches: batchesWithDetails
    });
  } catch (error) {
    console.error("Get available batches error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch available batches'
    });
  }
};

// Request to Join a Batch
const requestJoinBatch = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { batchId, message } = req.body;
    const { Batch } = require("../models/TeacherDashboard");

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required"
      });
    }

    // Check if batch exists and is active
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    if (batch.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "This batch is not accepting new students"
      });
    }

    // Check if student is already in the batch
    if (batch.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: "You are already in this batch"
      });
    }

    // Get student details
    const student = await UserStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Initialize join requests array if it doesn't exist
    if (!batch.joinRequests) {
      batch.joinRequests = [];
    }

    // Check if student has already requested to join
    const existingRequest = batch.joinRequests.find(
      request => request.student.toString() === studentId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already requested to join this batch"
      });
    }

    // Add join request
    batch.joinRequests.push({
      student: studentId,
      message: message || '',
      requestDate: new Date(),
      status: 'pending'
    });

    await batch.save();

    res.status(200).json({
      success: true,
      message: "Join request sent successfully. You will be notified when the teacher responds."
    });
  } catch (error) {
    console.error("Request join batch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send join request'
    });
  }
};

// Get Student's Batch Join Requests
const getMyBatchRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { Batch } = require("../models/TeacherDashboard");

    const batchesWithRequests = await Batch.find({
      'joinRequests.student': studentId
    })
    .populate('teacher', 'name email')
    .lean();

    const requests = batchesWithRequests.map(batch => {
      const request = batch.joinRequests.find(
        req => req.student.toString() === studentId
      );
      
      return {
        id: request._id,
        batchId: batch._id,
        batchName: batch.batchName,
        subject: batch.subject,
        teacher: batch.teacher,
        message: request.message,
        status: request.status,
        requestDate: request.requestDate,
        responseDate: request.responseDate,
        responseMessage: request.responseMessage
      };
    });

    res.status(200).json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error("Get batch requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch batch requests'
    });
  }
};

// Get Student's Current Batches
const getMyBatches = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { Batch } = require("../models/TeacherDashboard");

    const batches = await Batch.find({
      students: studentId,
      status: 'active'
    })
    .populate('teacher', 'name email organization')
    .lean();

    const batchesWithDetails = batches.map(batch => ({
      id: batch._id,
      batchName: batch.batchName,
      subject: batch.subject,
      teacher: {
        name: batch.teacher.name,
        email: batch.teacher.email,
        organization: batch.teacher.organization
      },
      schedule: batch.schedule,
      studentsCount: batch.students.length,
      status: batch.status
    }));

    res.status(200).json({
      success: true,
      batches: batchesWithDetails
    });
  } catch (error) {
    console.error("Get my batches error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch your batches'
    });
  }
};

// Get all students (for admin to view and manage academic performance)
const GetAllStudents = async (req, res) => {
  try {
    const students = await UserStudent.find({})
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 });

    const studentsData = students.map(student => ({
      id: student._id,
      name: student.name,
      email: student.contact?.email,
      phone: student.contact?.phone,
      class: student.class,
      schoolName: student.currSchool,
      status: student.status || "Active",
      profilePic: student.profilePic,
      dateOfJoining: student.dateOfJoining,
      academicPerformance: student.academicPerformance || null
    }));

    res.status(200).json({
      success: true,
      students: studentsData,
      total: studentsData.length
    });
  } catch (error) {
    console.error("Get all students error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch students'
    });
  }
};

// Add academic performance for a specific student (Admin only)
const AddAcademicPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject, score, grade, maxScore, semester, year, examType } = req.body;

    if (!subject || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "Subject and score are required"
      });
    }

    const student = await UserStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Initialize academic performance if it doesn't exist
    if (!student.academicPerformance) {
      student.academicPerformance = {
        subjects: [],
        overallGPA: 0,
        overallPercentage: 0,
        rank: 0,
        totalStudents: 0
      };
    }

    // Create new subject entry
    const newSubjectEntry = {
      name: subject,
      score: score,
      maxScore: maxScore || 100,
      grade: grade || calculateGrade(score, maxScore || 100),
      semester: semester || 'Current',
      year: year || new Date().getFullYear().toString(),
      examType: examType || 'Regular',
      addedAt: new Date()
    };

    // Check if subject already exists for this semester/year
    const existingSubjectIndex = student.academicPerformance.subjects.findIndex(
      sub => sub.name === subject && sub.semester === newSubjectEntry.semester && sub.year === newSubjectEntry.year
    );

    if (existingSubjectIndex !== -1) {
      // Update existing subject
      student.academicPerformance.subjects[existingSubjectIndex] = newSubjectEntry;
    } else {
      // Add new subject
      student.academicPerformance.subjects.push(newSubjectEntry);
    }

    // Calculate overall performance
    const subjects = student.academicPerformance.subjects;
    const totalScore = subjects.reduce((sum, sub) => sum + sub.score, 0);
    const totalMaxScore = subjects.reduce((sum, sub) => sum + sub.maxScore, 0);
    const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    
    student.academicPerformance.overallPercentage = Math.round(overallPercentage * 100) / 100;
    student.academicPerformance.overallGPA = calculateGPA(overallPercentage);
    student.academicPerformance.lastUpdated = new Date();

    await student.save();

    res.status(200).json({
      success: true,
      message: "Academic performance added successfully",
      academicPerformance: student.academicPerformance
    });
  } catch (error) {
    console.error("Add academic performance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to add academic performance'
    });
  }
};

// Helper function to calculate grade
function calculateGrade(score, maxScore = 100) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'D';
}

// Helper function to calculate GPA
function calculateGPA(percentage) {
  if (percentage >= 90) return 10.0;
  if (percentage >= 80) return 8.0;
  if (percentage >= 70) return 7.0;
  if (percentage >= 60) return 6.0;
  if (percentage >= 50) return 5.0;
  if (percentage >= 40) return 4.0;
  return 0.0;
}

module.exports = { 
  StudentRegister, 
  StudentLogin, 
  StudentProfile, 
  StudentForgotPassword, 
  StudentResetPassword, 
  StudentUpdateProfile, 
  UpdateAcademicPerformance, 
  GetAllStudents, 
  AddAcademicPerformance,
  getAvailableBatches,
  requestJoinBatch,
  getMyBatchRequests,
  getMyBatches
};