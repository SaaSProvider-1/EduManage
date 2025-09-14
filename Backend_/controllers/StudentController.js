
const UserStudent = require("../models/User-Student");
const bcrypt = require("bcryptjs");

const StudentRegister = async (req, res) => {
  console.log("Received registration data:", req.body);
  console.log("Received registration files:", req.files);

  const {
    // Personal Info
    name,
    email,
    studentPhone,
    dateOfJoining,
    photo,
    bloodGroup,
    // Academic Info
    class: studentClass,
    schoolName,
    lastSchoolAttended,
    // Family Info
    fatherName,
    motherName,
    guardianPhone,
    // Document & Address Info
    aadharNumber,
    aadharDocument,
    completeAddress,
    // Password Info
    password,
    confirmPassword,
  } = req.body;

  function validatePassword(password) {
    const minLength = 8;
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!password || password.length < minLength) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!regex.test(password)) {
      return {
        valid: false,
        message:
          "Password must include uppercase, lowercase, number, and special character.",
      };
    }
    return { valid: true };
  }

  try {
    // Check if user already exists
    const existingUser = await UserStudent.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const validatePass = validatePassword(password);
    if (!validatePass.valid) {
      return res.status(400).json({
        success: false,
        error: validatePass.message,
      });
    }

    // Password match or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password don't match at all",
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // get uploaded file URLs from Cloudinary
    const photoUrl = req.files?.photo ? req.files.photo[0].path : null;
    const aadharUrl = req.files?.aadharDocument
      ? req.files.aadharDocument[0].path
      : null;

    // Save new user
    const newStudent = new UserStudent({
      name,
      email,
      studentPhone,
      dateOfJoining: new Date(dateOfJoining),
      bloodGroup,
      // Save file paths
      photo: photoUrl,
      class: studentClass,
      schoolName,
      lastSchoolAttended,
      fatherName,
      motherName,
      guardianPhone,
      aadharNumber,
      aadharDocument: aadharUrl,
      completeAddress,
      password: hashPassword,
      confirmPassword: hashPassword,
    });
    await newStudent.save();

    res.status(200).json({
      success: true,
      message: "Registration endpoint hit successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

module.exports = StudentRegister;

// const StudentLogin = async (req, res) => {

// }