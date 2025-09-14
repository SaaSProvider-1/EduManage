const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const StudentRegister = require("../controllers/StudentController");

router.post(
  "/register",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "aadharDocument", maxCount: 1 },
  ]), 
  StudentRegister
);

module.exports = router;