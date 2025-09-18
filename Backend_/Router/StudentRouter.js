const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const { StudentRegister, StudentLogin, StudentProfile, StudentForgotPassword, StudentResetPassword } = require("../controllers/StudentController");
const { StudentAuth } = require('../middleware/RoleBasedAuth');

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

// Update academic performance (for testing/admin purposes)
router.put("/academic-performance", StudentAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subjects, overallGPA, overallPercentage, rank, totalStudents } = req.body;

    const student = await UserStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    student.academicPerformance = {
      subjects: subjects || [],
      overallGPA: overallGPA || 0,
      overallPercentage: overallPercentage || 0,
      rank: rank || 0,
      totalStudents: totalStudents || 0
    };

    await student.save();

    res.json({
      success: true,
      message: "Academic performance updated successfully",
      academicPerformance: student.academicPerformance
    });
  } catch (error) {
    console.error("Update academic performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update academic performance"
    });
  }
});

module.exports = router;