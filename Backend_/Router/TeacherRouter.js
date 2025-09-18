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
  markAttendance,
  teacherCheckInOut,
  manageTask,
  getTeacherTasks
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

router.post("/attendance", TeacherAuth, markAttendance);

router.post("/check-attendance", TeacherAuth, teacherCheckInOut);

router.post("/tasks", TeacherAuth, manageTask);

router.put("/tasks", TeacherAuth, manageTask);

router.get("/tasks", TeacherAuth, getTeacherTasks);

module.exports = router;
