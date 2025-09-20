// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const Express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const {
  sendTestEmail,
  sendTeacherWelcomeEmail,
  sendStudentWelcomeEmail,
} = require("./config/emailService");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const UserTeacher = require("./models/User-Teacher");
const UserStudent = require("./models/User-Student");
const Admin = require("./models/User-Admin");

const StudentRouter = require("./Router/StudentRouter");
const TeacherRouter = require("./Router/TeacherRouter");
const TenantRouter = require("./Router/TenantRouter");
const AdminRouter = require("./Router/AdminRouter");
const upload = require("./config/upload");

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

// Email verification for admins
app.post("/admin/verify-email", async (req, res) => {
  const { email } = req.body;
  const emailTemplate = (url) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <h2 style="color: #2c3e50; text-align: center;">Welcome to EduManage Admin Portal!</h2>
      
      <p style="font-size: 16px; margin-bottom: 20px;">
        Click the button below to verify your email address and complete your admin registration:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" 
           style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
          Verify Email
        </a>
      </div>
      
      <p style="font-size: 14px; color: #555;">
        This link will expire in <strong>1 hour</strong>.
      </p>
      
      <p style="font-size: 14px; color: #555;">
        If you did not request this, please ignore this email.
      </p>
      
      <br/>
      <p style="font-size: 14px; text-align: center; color: #888;">
        Best regards,<br/>
        <strong>EduManage Team</strong>
      </p>
    </div>
  </div>
`;

  try {
    // Check if admin with the email exists
    const admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email exists",
      });
    }

    // Generate a verification token
    const tokenString = await crypto.randomBytes(32).toString("hex");
    const token = new Admin({ email, emailVerificationToken: tokenString });
    await token.save();

    const link = `http://localhost:5173/admin/verify-email?token=${tokenString}&email=${email}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "EduManage Admin Email Verification",
      html: emailTemplate(link),
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent",
      link: link,
    });
  } catch (error) {
    console.error("Admin email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin email verification",
      error: error.message,
    });
  }
});

app.get("/admin/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  const admin = await Admin.findOne({ emailVerificationToken: token });
  if(!admin) {
    return res.status(400).json({ message: "Invalid or Expired token" });
  }

  admin.isEmailVerified = true;
  admin.emailVerificationToken = undefined;
  await admin.save();

  res.status(200).json({ message: "Email verified successfully" });
});

// Test email route for debugging
app.post("/api/test-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    console.log(`Testing email functionality with email: ${email}`);
    const result = await sendTestEmail(email);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Test email sent successfully!",
        messageId: result.messageId,
        details: result.info,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Test email route error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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
      emailVerificationExpires: { $gt: Date.now() },
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
      "contact.email": email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
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
      console.log(
        `Welcome email sent to verified student: ${student.contact.email}`
      );
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

app.post("/admin/register", AdminRouter);

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
