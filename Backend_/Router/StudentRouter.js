const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const { StudentRegister, StudentLogin, StudentProfile } = require("../controllers/StudentController");
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

router.post("/porfile", StudentAuth, StudentProfile);

module.exports = router;