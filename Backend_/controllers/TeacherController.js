const UserTeacher = require("../models/User-Teacher");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const TeacherRegister = async (req, res) => {
  console.log("Response from app.js: ", req.body);

  const {
    name,
    email,
    phone,
    profilePicture,
    password,
    role,
    organization,
    qualifications,
    specialization,
    experience,
    teacherId,
    assignedClasses,
  } = req.body;

  function validatePassword(password) {
    const minLength = 8;
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$&!%*?])[A-Za-z\d@$&!%*?]{8,}$/;

    if (password.length <= minLength) {
      return {
        valid: false,
        message: "Password must me atleast 8 charatctes long",
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
    // Check if user exist or not
    const IsUserExist = await UserTeacher.findOne({ email });
    if (IsUserExist) {
      return res.status(403).json({
        success: false,
        message: "User already exists",
      });
    }

    // Validate Password
    const validatePass = validatePassword(password);
    if (!validatePass) {
      return res.status(400).json({
        success: false,
        message: validatePass?.message,
      });
    }

    // Hash form password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const photoUrl = req.file ? req.file.path : null;

    const newUserTeacher = new UserTeacher({
      name,
      phone,
      email,
      profilePicture: photoUrl,
      password: hashPassword,
      role,
      organization,
      qualifications,
      specialization,
      experience,
      teacherId,
      assignedClasses,
    });
    await newUserTeacher.save();

    res.status(201).json({
      success: true,
      message: "New Teacher User Created",
      user: req.body,
    });
  } catch (error) {
    console.log("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

const TeacherLogin = async (req, res) => {
  console.log("Teacher login data received:", req.body);
  const { email, password } = req.body;
  try {
    // Check for the User
    const IsUserExist = await UserTeacher.findOne({ email });
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
        role: IsUserExist.role,
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

const TeacherProfile = async (req, res) => {
  try {
    const teacher = await UserTeacher.findById(req.user.id).select(
      "-password"
    );
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { TeacherRegister, TeacherLogin, TeacherProfile };
