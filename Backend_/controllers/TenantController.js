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
      paymentId, // Payment gateway payment ID
      orderId, // Payment gateway order ID
    } = req.body;

    console.log("Tenant registration request:", req.body);

    // Validate and sanitize planType
    let planType = req.body.planType;
    if (Array.isArray(planType)) {
      planType = planType[0]; // Take first element if it's an array
    }
    planType = planType?.toString().toLowerCase().trim();
    
    // Validate planType is one of allowed values
    if (!["standard", "premium"].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan type. Must be either 'standard' or 'premium'."
      });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: "A coaching center with this email already exists"
      });
    }

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
      paymentStatus: paymentId ? "completed" : "pending",
      lastPaymentDate: paymentId ? Date.now() : undefined,
      paymentId,
      orderId,
      status: "pending", // Will be activated after email verification
      isEmailVerified: false,
      emailVerificationToken: emailVerifyToken,
      emailVerificationExpires,
    });

    await newTenant.save();

    // Send email (with error handling)
    let emailSent = false;
    try {
      const verifyUrl = `${process.env.CLIENT_URL}/coaching/verify/${emailVerifyToken}`;
      const paymentStatusText = paymentId ? 
        `<p style="color: #4CAF50; font-weight: bold;">✅ Payment Confirmed - ${planType.toUpperCase()} Plan Active</p>` :
        `<p style="color: #f44336; font-weight: bold;">⏳ Payment Pending</p>`;
      
      await sendEmail(
        email,
        "Welcome to EduManage - Verify Your Account",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">🎉 Welcome to EduManage!</h2>
          <p><strong>Coaching Center:</strong> ${centerName}</p>
          <p><strong>Owner:</strong> ${ownerName}</p>
          ${paymentStatusText}
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Your License Key</h3>
            <p style="font-size: 18px; font-weight: bold; color: #2196F3; background: #e3f2fd; padding: 10px; border-radius: 3px;">${licenseKey}</p>
            <p style="font-size: 12px; color: #666;">Share this key with your students for registration</p>
          </div>
          <p>Please verify your email by clicking the button below:</p>
          <a href="${verifyUrl}" 
             style="display:inline-block; padding:12px 24px; background:#4CAF50; color:white; text-decoration:none; border-radius:5px; font-weight: bold;">
             Verify Email & Activate Account
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This link will expire in 1 hour. If you didn't create this account, please ignore this email.
          </p>
        </div>
        `
      );
      emailSent = true;
      console.log("✅ Verification email sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      // Continue with registration even if email fails
    }

    const responseMessage = emailSent 
      ? "Tenant registered successfully. Check your email for verification."
      : "Tenant registered successfully. Email verification temporarily unavailable - your account is active.";

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        tenantId: newTenant._id,
        licenseKey: licenseKey,
        email: email,
        centerName: centerName,
        planType: planType,
        subscriptionStatus: "active",
        emailSent: emailSent
      }
    });
  } catch (error) {
    console.error("Error in registerTenant:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Verify License Key
const verifyLicenseKey = async (req, res) => {
  try {
    const { licenseKey } = req.params;

    if (!licenseKey) {
      return res.status(400).json({
        success: false,
        message: "License key is required"
      });
    }

    // Remove dashes from license key for comparison
    const cleanLicenseKey = licenseKey.replace(/-/g, '');

    // Find tenant with the provided license key (both with and without dashes)
    const tenant = await Tenant.findOne({ 
      $or: [
        { licenseKey: licenseKey },
        { licenseKey: cleanLicenseKey }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Invalid license key. Please check and try again."
      });
    }

    // Check if tenant is active
    if (tenant.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This license key is not active. Please contact support."
      });
    }

    // Return tenant information (without sensitive data)
    res.status(200).json({
      success: true,
      message: "License key is valid",
      data: {
        centerName: tenant.centerName || 'Not specified',
        location: `${tenant.city || 'Not specified'}, ${tenant.state || 'Not specified'}`,
        address: tenant.address || 'Not specified',
        city: tenant.city || 'Not specified',
        state: tenant.state || 'Not specified',
        pinCode: tenant.pinCode || 'Not specified',
        coachingType: tenant.coachingType || 'Not specified',
        ownerName: tenant.ownerName || 'Not specified',
        planType: tenant.planType || 'standard',
        subscriptionStatus: tenant.subscriptionStatus || 'active',
        isEmailVerified: tenant.isEmailVerified || false,
        yearEstablished: tenant.yearEstablished || 'Not specified'
      }
    });
  } catch (error) {
    console.error("Error in verifyLicenseKey:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
      error: error.message
    });
  }
};

// ✅ Verify Tenant Email
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

module.exports = { registerTenant, verifyEmail, verifyLicenseKey };
