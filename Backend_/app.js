// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const Express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { sendTestEmail, sendTeacherWelcomeEmail, sendStudentWelcomeEmail } = require("./config/emailService");
const UserTeacher = require("./models/User-Teacher");
const UserStudent = require("./models/User-Student");

const StudentRouter = require("./Router/StudentRouter");
const TeacherRouter = require("./Router/TeacherRouter");
const TenantRouter = require("./Router/TenantRouter");

// Express app setup
const app = Express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
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

// Test email route for debugging
app.post("/api/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    console.log(`Testing email functionality with email: ${email}`);
    const result = await sendTestEmail(email);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Test email sent successfully!",
        messageId: result.messageId,
        details: result.info
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Test email route error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Email verification endpoint for teachers
app.get("/api/verify-email/teacher", async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #e74c3c;">❌ Verification Failed</h1>
            <p>Invalid verification link. Token or email is missing.</p>
            <a href="http://localhost:5173/register" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Registration</a>
          </body>
        </html>
      `);
    }

    // Find teacher with matching token and email
    const teacher = await UserTeacher.findOne({
      email: email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!teacher) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #e74c3c;">❌ Verification Failed</h1>
            <p>Invalid or expired verification token. Please register again.</p>
            <a href="http://localhost:5173/register" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Registration</a>
          </body>
        </html>
      `);
    }

    // Update teacher verification status
    teacher.isEmailVerified = true;
    teacher.emailVerificationToken = undefined;
    teacher.emailVerificationExpires = undefined;
    await teacher.save();

    // Send welcome email after verification
    try {
      await sendTeacherWelcomeEmail(teacher.name, teacher.email);
      console.log(`Welcome email sent to verified teacher: ${teacher.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #27ae60;">✅ Email Verified Successfully!</h1>
          <p>Welcome to EduManage, <strong>${teacher.name}</strong>!</p>
          <p>Your teacher account has been activated. You can now log in to access your dashboard.</p>
          <a href="http://localhost:5173/login?role=teacher" style="background-color: #5c84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px;">Login to Dashboard</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Teacher verification error:", error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Server Error</h1>
          <p>Something went wrong during verification. Please try again.</p>
          <a href="http://localhost:5173/register" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Registration</a>
        </body>
      </html>
    `);
  }
});

// Email verification endpoint for students
app.get("/api/verify-email/student", async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #e74c3c;">❌ Verification Failed</h1>
            <p>Invalid verification link. Token or email is missing.</p>
            <a href="http://localhost:5173/register" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Registration</a>
          </body>
        </html>
      `);
    }

    // Find student with matching token and email
    const student = await UserStudent.findOne({
      'contact.email': email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #e74c3c;">❌ Verification Failed</h1>
            <p>Invalid or expired verification token. Please register again.</p>
            <a href="http://localhost:5173/register" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Registration</a>
          </body>
        </html>
      `);
    }

    // Update student verification status
    student.isEmailVerified = true;
    student.emailVerificationToken = undefined;
    student.emailVerificationExpires = undefined;
    await student.save();

    // Send welcome email after verification
    try {
      await sendStudentWelcomeEmail(student.name, student.contact.email);
      console.log(`Welcome email sent to verified student: ${student.contact.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #27ae60;">✅ Email Verified Successfully!</h1>
          <p>Welcome to EduManage, <strong>${student.name}</strong>!</p>
          <p>Your student account has been activated. You can now log in to access your portal.</p>
          <a href="http://localhost:5173/login?role=student" style="background-color: #00b3ee; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px;">Login to Portal</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Student verification error:", error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">❌ Server Error</h1>
          <p>Something went wrong during verification. Please try again.</p>
          <a href="http://localhost:5173/register" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Registration</a>
        </body>
      </html>
    `);
  }
});

// Student Route
app.use("/student", StudentRouter);

// Teacher Route
app.use("/teacher", TeacherRouter);

// Tenant Route
app.use("/tenant", TenantRouter);


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
