const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const UserStudent = require("../models/User-Student");
const { 
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
} = require("../controllers/StudentController");
const { StudentAuth, AdminAuth } = require('../middleware/RoleBasedAuth');

router.post(
  "/register",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "aadharDocument", maxCount: 1 },
  ]), 
  StudentRegister
);

router.post("/login", StudentLogin);

router.post("/forgot-password", StudentForgotPassword);

router.post("/reset-password", StudentResetPassword);

router.get("/profile", StudentAuth, StudentProfile);

router.put("/profile", StudentAuth, upload.fields([
  { name: "profilePicture", maxCount: 1 }
]), StudentUpdateProfile);

// Admin routes for managing students and academic performance
router.get("/all", AdminAuth, GetAllStudents);
router.put("/academic-performance/:studentId", AdminAuth, UpdateAcademicPerformance);
router.post("/academic-performance/:studentId", AdminAuth, AddAcademicPerformance);

// Batch management routes for students
router.get("/available-batches", StudentAuth, getAvailableBatches);
router.post("/join-batch", StudentAuth, requestJoinBatch);
router.get("/batch-requests", StudentAuth, getMyBatchRequests);
router.get("/my-batches", StudentAuth, getMyBatches);

module.exports = router;