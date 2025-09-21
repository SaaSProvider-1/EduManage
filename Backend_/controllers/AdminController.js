const Admin = require("../models/User-Admin");
const bcrypt = require("bcryptjs");

const AdminRegister = async (req, res) => {
  console.log("Details from Backend", req.body);
  console.log("Files from Backend", req.file);
  const { role, fullname, phone, email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email: email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin's email is exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      role,
      fullname,
      phone,
      email,
      password: hashedPassword,
      profilePic: req.file ? req.file.path : undefined,
    });

    await newAdmin.save();
    res
      .status(200)
      .json({ success: true, message: "Admin registration successful" });
  } catch (error) {
    console.error("Admin registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during admin registration",
      error: error.message,
    });
  }
};

module.exports = { AdminRegister };