const express = require("express");
const router = express.Router();
const upload = require("../config/upload");

const { TeacherRegister, TeacherLogin, TeacherProfile } = require("../controllers/TeacherController");
const { TeacherAuth } = require('../middleware/RoleBasedAuth');

router.post(
  "/register",
  upload.single("profilePicture"),
  TeacherRegister
);

router.post("/login", TeacherLogin);

router.get("/dashboard", TeacherAuth, TeacherProfile);

module.exports = router;
