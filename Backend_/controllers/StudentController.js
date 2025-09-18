const UserStudent = require("../models/User-Student");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const StudentRegister = async (req, res) => {
  console.log("Student registration data received:", req.body);
  const {
    // Personal Info
    role,
    name,
    email,
    phone,
    dateOfJoining,
    profilePicture,
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
    password
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
    const photoUrl = req.files?.profilePicture ? req.files.profilePicture[0].path : null;
    const aadharUrl = req.files?.aadharDocument
      ? req.files.aadharDocument[0].path
      : null;

    // Save new user
    const newStudent = new UserStudent({
      role,
      name,
      bloodGroup,
      profilePic: photoUrl,

      contact: {
        email,
        phone,
        parentPhone: guardianPhone,
      },
      
      dateOfJoining: new Date(dateOfJoining),
      class: studentClass,
      currSchool: schoolName,
      lastSchool: lastSchoolAttended,

      parents: {
        father: fatherName,
        mother: motherName,
      },

      aadhar: {
        number: aadharNumber,
        url: aadharUrl,
      },

      address: completeAddress,
      password: hashPassword,
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

const StudentLogin = async (req, res) => {
  console.log("Student login data received:", req.body);
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
};

const StudentProfile = async (req, res) => {
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
}

module.exports = { StudentRegister, StudentLogin, StudentProfile };