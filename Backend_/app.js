// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const Express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const StudentRouter = require("./Router/StudentRouter");
const UserStudent = require("./models/User-Student");
const StudentAuth = require("./middleware/StudentAuth");

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

// Student Registration Route
app.use("/student", StudentRouter);

app.post("/student/login", async (req, res) => {
  console.log("Response from Req.Body", req.body);
  const { email, password } = req.body;
  try {
    // Check for the User
    const IsUserExist = await UserStudent.findOne({ email });
    if (!IsUserExist) {
      return res.status(403).json({
        success: false,
        message: "User is not Exist",
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
});

app.get("/student/profile", StudentAuth, async (req, res) => {
  try {
    const student = await UserStudent.findById(req.user.id).select(
      "-password, -confirmPassword"
    );
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
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
