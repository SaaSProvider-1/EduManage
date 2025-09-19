const express = require("express");
const router = express.Router();
const upload = require("../config/upload");

const { 
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
} = require("../controllers/TeacherController");
const { TeacherAuth } = require('../middleware/RoleBasedAuth');

router.post(
  "/register",
  upload.single("profilePicture"),
  TeacherRegister
);

router.post("/login", TeacherLogin);

router.post("/forgot-password", TeacherForgotPassword);

router.post("/reset-password", TeacherResetPassword);

// Protected routes
router.get("/dashboard", TeacherAuth, TeacherProfile);

router.get("/dashboard-data", TeacherAuth, getTeacherDashboard);

router.get("/batches", TeacherAuth, getTeacherBatches);

router.get("/students", TeacherAuth, getTeacherStudents);

router.post("/attendance", TeacherAuth, markAttendance);

router.post("/check-attendance", TeacherAuth, teacherCheckInOut);

router.post("/tasks", TeacherAuth, manageTask);

router.put("/tasks", TeacherAuth, manageTask);

router.get("/tasks", TeacherAuth, getTeacherTasks);

// Batch management routes
router.post("/batches", TeacherAuth, createBatch);

router.put("/batches/:batchId", TeacherAuth, updateBatch);

router.delete("/batches/:batchId", TeacherAuth, deleteBatch);

// Marks management routes
router.get("/marks", TeacherAuth, getMarks);

router.post("/marks", TeacherAuth, saveMarks);

// Join request management routes
router.get("/join-requests", TeacherAuth, getBatchJoinRequests);

router.post("/handle-join-request", TeacherAuth, handleJoinRequest);

module.exports = router;
