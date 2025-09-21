const bcrypt = require("bcryptjs");
const Tenant = require("../models/CoachingCenter");
const generateLicenseKey = require("../utils/licenseUtils");
const generateVerificationToken = require("../utils/tokenGenerator");
const sendEmail = require("../utils/sendEmail");

const registerTenant = async (req, res) => {
  try {
    const {
      ownerName,
      email,
      phone,
      password,
      centerName,
      address,
      city,
      state,
      pinCode,
      yearEstablished,
      coachingType,
      logoFile,
      planType, // frontend should send this
    } = req.body;


    // Generate license key
    const licenseKey = generateLicenseKey();

    // Generate email verification token
    const emailVerifyToken = generateVerificationToken();
    const emailVerificationExpires = Date.now() + 3600000; // 1 hour

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const pic = req.file ? req.file.path : undefined;

    // Save tenant
    const newTenant = new Tenant({
      ownerName,
      email,
      phone,
      password: hashedPassword,
      licenseKey: licenseKey,
      planType,
      centerName,
      address,
      city,
      state,
      pinCode,
      yearEstablished,
      coachingType,
      logoFile: pic,
      subscriptionStatus: "active",
      subscriptionStartDate: Date.now(),
      paymentStatus: "completed",
      lastPaymentDate: Date.now(),
      status: "active",
      isEmailVerified: false,
      emailVerificationToken: emailVerifyToken,
      emailVerificationExpires,
    });

    await newTenant.save();

    // Send email
    const verifyUrl = `${process.env.CLIENT_URL}/coaching/verify/${emailVerifyToken}`;
    await sendEmail(
      email,
      "Verify your Coaching Account",
      `
      <h2>Congratulations 🎉</h2>
      <p>Your license key: <b>${licenseKey}</b></p>
      <p>Please verify your email by clicking the button below:</p>
      <a href="${verifyUrl}" 
         style="display:inline-block; padding:10px 20px; background:#4CAF50; color:white; text-decoration:none; border-radius:5px;">
         Verify Email
      </a>
      `
    );

    res.status(201).json({
      message:
        "Tenant registered successfully. Check your email for verification.",
      tenantId: newTenant._id,
    });
  } catch (error) {
    console.error("Error in registerTenant:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Verify Tenant
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const tenant = await Tenant.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!tenant) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    tenant.isEmailVerified = true;
    tenant.emailVerificationToken = undefined;
    tenant.emailVerificationExpires = undefined;
    tenant.status = "active";

    await tenant.save();

    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { registerTenant, verifyEmail };
