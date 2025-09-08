// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const Express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Import models
const UserStudent = require("./models/User-Student");

// Express app setup
const app = Express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(Express.json());
app.use(cors());

// MongoDB connection
const url = process.env.MONGODB_URL;
mongoose
  .connect(url)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EduManage Backend Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Student Registeration Route
app.post("/student-register", async (req, res) => {
  try {
    const {
      // Personal Information
      name,
      email,
      dateOfJoining,
      photo,
      // Academic Information
      class: studentClass,
      schoolName,
      lastSchoolAttended,
      // Family Information
      fatherName,
      motherName,
      guardianPhone,
      // Document Information
      aadharNumber,
      aadharDocument,
      completeAddress,
      // Password Information
      password,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !dateOfJoining ||
      !photo ||
      !studentClass ||
      !schoolName ||
      !lastSchoolAttended ||
      !fatherName ||
      !motherName ||
      !guardianPhone ||
      !aadharNumber ||
      !aadharDocument ||
      !completeAddress ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    // Check if email already exists
    const existingEmailUser = await UserStudent.findByEmail(email);
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if Aadhar number already exists
    const existingAadharUser = await UserStudent.findOne({ aadharNumber });
    if (existingAadharUser) {
      return res.status(409).json({
        success: false,
        message: "Aadhar number already registered",
      });
    }

    // Create new student
    const newStudent = new UserStudent({
      // Personal Information
      name: name.trim(),
      email: email.toLowerCase().trim(),
      dateOfJoining: new Date(dateOfJoining),
      photo,
      // Academic Information
      class: studentClass,
      schoolName: schoolName.trim(),
      lastSchoolAttended: lastSchoolAttended.trim(),
      // Family Information
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      guardianPhone: guardianPhone.trim(),
      // Document Information
      aadharNumber: aadharNumber.trim(),
      aadharDocument,
      completeAddress: completeAddress.trim(),
      // Password Information
      password, // This will be hashed by the pre-save middleware
    });

    // Save the student
    const savedStudent = await newStudent.save();

    // Return success response (excluding password)
    res.status(201).json({
      success: true,
      message: "Student registration successful",
      data: {
        studentId: savedStudent.studentId,
        name: savedStudent.name,
        email: savedStudent.email,
        class: savedStudent.class,
        status: savedStudent.status,
        enrollmentDate: savedStudent.enrollmentDate,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Student Login Route
app.post("/student-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find student by email
    const student = await UserStudent.findByEmail(email);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is approved (allow pending, approved, and active)
    if (student.status === 'rejected' || student.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: `Account is ${student.status}. Please contact administration.`,
      });
    }

    // Compare password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    await student.updateLastLogin();

    // Return success response (excluding password and sensitive fields)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        class: student.class,
        status: student.status,
        schoolName: student.schoolName,
        photo: student.photo,
        lastLogin: student.lastLogin,
        enrollmentDate: student.enrollmentDate
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Student Logout Route
app.post("/student-logout", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Find student and update last logout (optional)
    const student = await UserStudent.findByStudentId(studentId);
    if (student) {
      // You can add a lastLogout field to track logout times
      // student.lastLogout = new Date();
      // await student.save();
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify Student Route (for checking if user is still valid)
app.post("/student-verify", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const student = await UserStudent.findByStudentId(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if account is still active
    if (student.status !== 'approved' && student.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${student.status}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Student verified",
      data: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        class: student.class,
        status: student.status,
        schoolName: student.schoolName,
        photo: student.photo
      },
    });

  } catch (error) {
    console.error("Verify student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Change Password Route
app.post("/student-change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate required fields
    if (!email || !currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // Find student
    const student = await UserStudent.findByEmail(email);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await student.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password (will be hashed by pre-save middleware)
    student.password = newPassword;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Change password error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get student by ID route
app.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await UserStudent.findByStudentId(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all students route (for admin)
app.get("/students", async (req, res) => {
  try {
    const { status, class: studentClass, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (studentClass) filter.class = studentClass;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get students with pagination
    const students = await UserStudent.find(filter)
      .select("-password")
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalStudents = await UserStudent.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStudents,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
