// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const Express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const StudentRouter = require("./Router/StudentRouter");
const TeacherRouter = require("./Router/TeacherRouter");

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

// Student Route
app.use("/student", StudentRouter);

// Teacher Route
app.use("/teacher", TeacherRouter);


app.post("/tenant/register", async(req, res) => {
  console.log(req.body);
})


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
