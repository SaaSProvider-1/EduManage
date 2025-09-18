const UserStudent = require("../models/User-Student");
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
      message: "Student registration initiated! Please check your email and click the verification link to complete your registration.",
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

    console.log("Raw student data from DB:", JSON.stringify(student, null, 2));

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
      // Academic Performance - use real data if available, otherwise provide sample data
      academicPerformance: student.academicPerformance || {
        subjects: [
          { name: "Mathematics", score: 85, grade: "A", semester: "Current", year: "2025" },
          { name: "Science", score: 78, grade: "B+", semester: "Current", year: "2025" },
          { name: "English", score: 92, grade: "A+", semester: "Current", year: "2025" },
          { name: "Social Studies", score: 74, grade: "B", semester: "Current", year: "2025" },
          { name: "Hindi", score: 81, grade: "A-", semester: "Current", year: "2025" }
        ],
        overallGPA: 8.2,
        overallPercentage: 82,
        rank: 5,
        totalStudents: 45
      }
    };

    console.log("Transformed profile data:", JSON.stringify(profileData, null, 2));

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

module.exports = { StudentRegister, StudentLogin, StudentProfile, StudentForgotPassword, StudentResetPassword };