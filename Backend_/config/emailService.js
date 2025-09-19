const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Teacher welcome email template
const getTeacherWelcomeEmailTemplate = (teacherName, email) => {
  return {
    subject: 'Welcome to EduManage - Teacher Registration Successful!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #5c84ff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #5c84ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .highlight { color: #5c84ff; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to EduManage!</h1>
          </div>
          <div class="content">
            <h2>Hello ${teacherName}!</h2>
            <p>Congratulations! Your teacher registration has been successfully completed.</p>
            
            <p><strong>Registration Details:</strong></p>
            <ul>
              <li><span class="highlight">Name:</span> ${teacherName}</li>
              <li><span class="highlight">Email:</span> ${email}</li>
              <li><span class="highlight">Role:</span> Teacher</li>
              <li><span class="highlight">Registration Date:</span> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p>You can now log in to your account and start managing your classes, students, and educational resources.</p>
            
            <div style="text-align: center;">
              <a href="http://localhost:5173/login?role=teacher" class="button">Login to Your Account</a>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Complete your profile setup</li>
              <li>Explore the teacher dashboard</li>
              <li>Start creating and managing your classes</li>
              <li>Upload educational resources</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing EduManage!</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Student welcome email template
const getStudentWelcomeEmailTemplate = (studentName, email) => {
  return {
    subject: 'Welcome to EduManage - Student Registration Successful!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00b3ee; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #00b3ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .highlight { color: #00b3ee; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to EduManage!</h1>
          </div>
          <div class="content">
            <h2>Hello ${studentName}!</h2>
            <p>Congratulations! Your student registration has been successfully completed.</p>
            
            <p><strong>Registration Details:</strong></p>
            <ul>
              <li><span class="highlight">Name:</span> ${studentName}</li>
              <li><span class="highlight">Email:</span> ${email}</li>
              <li><span class="highlight">Role:</span> Student</li>
              <li><span class="highlight">Registration Date:</span> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p>You can now log in to your student portal and start accessing your courses, assignments, and educational resources.</p>
            
            <div style="text-align: center;">
              <a href="http://localhost:5173/login?role=student" class="button">Login to Your Account</a>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Complete your profile setup</li>
              <li>Explore the student dashboard</li>
              <li>Access your enrolled courses</li>
              <li>View assignments and study materials</li>
              <li>Track your academic progress</li>
            </ul>
            
            <p><strong>For Parents/Guardians:</strong></p>
            <p>Your child has successfully registered for EduManage. You can monitor their progress and stay updated with their academic journey through our platform.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing EduManage!</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send email function
const sendEmail = async (to, emailTemplate) => {
  try {
    console.log('Attempting to send email to:', to);
    console.log('Using SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_EMAIL
    });

    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('SMTP server connection verified successfully');
    
    const mailOptions = {
      from: `"EduManage" <${process.env.SMTP_EMAIL}>`,
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    
    return { success: true, messageId: info.messageId, info: info };
  } catch (error) {
    console.error('Error sending email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    return { success: false, error: error.message };
  }
};

// Send teacher welcome email
const sendTeacherWelcomeEmail = async (teacherName, email) => {
  const emailTemplate = getTeacherWelcomeEmailTemplate(teacherName, email);
  return await sendEmail(email, emailTemplate);
};

// Send student welcome email
const sendStudentWelcomeEmail = async (studentName, email) => {
  const emailTemplate = getStudentWelcomeEmailTemplate(studentName, email);
  return await sendEmail(email, emailTemplate);
};

// Test email function for debugging
const sendTestEmail = async (testEmail) => {
  const testTemplate = {
    subject: 'EduManage Test Email',
    html: `
      <h1>Test Email from EduManage</h1>
      <p>If you receive this email, your SMTP configuration is working correctly!</p>
      <p>Sent at: ${new Date().toLocaleString()}</p>
    `
  };
  
  console.log('Sending test email to:', testEmail);
  return await sendEmail(testEmail, testTemplate);
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Teacher email verification template
const getTeacherVerificationEmailTemplate = (teacherName, email, verificationToken) => {
  const verificationUrl = `http://localhost:3000/api/verify-email/teacher?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  
  return {
    subject: 'EduManage - Please Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #5c84ff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #5c84ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .highlight { color: #5c84ff; font-weight: bold; }
          .warning { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to EduManage!</h1>
            <h2>Email Verification Required</h2>
          </div>
          <div class="content">
            <h2>Hello ${teacherName}!</h2>
            <p>Thank you for registering as a teacher on EduManage. To complete your registration, please verify your email address.</p>
            
            <p><strong>Registration Details:</strong></p>
            <ul>
              <li><span class="highlight">Name:</span> ${teacherName}</li>
              <li><span class="highlight">Email:</span> ${email}</li>
              <li><span class="highlight">Role:</span> Teacher</li>
              <li><span class="highlight">Registration Date:</span> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This verification link will expire in 24 hours. Please verify your email as soon as possible.
            </div>
            
            <p><strong>What happens after verification?</strong></p>
            <ul>
              <li>Your account will be activated</li>
              <li>You'll be able to log in to the teacher dashboard</li>
              <li>Start managing your classes and students</li>
              <li>Access all EduManage features</li>
            </ul>
            
            <p>If you didn't create this account, please ignore this email.</p>
            
            <p><strong>Having trouble?</strong> Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing EduManage!</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Student email verification template
const getStudentVerificationEmailTemplate = (studentName, email, verificationToken) => {
  const verificationUrl = `http://localhost:3000/api/verify-email/student?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  
  return {
    subject: 'EduManage - Please Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00b3ee; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #00b3ee; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .highlight { color: #00b3ee; font-weight: bold; }
          .warning { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to EduManage!</h1>
            <h2>Email Verification Required</h2>
          </div>
          <div class="content">
            <h2>Hello ${studentName}!</h2>
            <p>Thank you for registering as a student on EduManage. To complete your registration, please verify your email address.</p>
            
            <p><strong>Registration Details:</strong></p>
            <ul>
              <li><span class="highlight">Name:</span> ${studentName}</li>
              <li><span class="highlight">Email:</span> ${email}</li>
              <li><span class="highlight">Role:</span> Student</li>
              <li><span class="highlight">Registration Date:</span> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This verification link will expire in 24 hours. Please verify your email as soon as possible.
            </div>
            
            <p><strong>What happens after verification?</strong></p>
            <ul>
              <li>Your account will be activated</li>
              <li>You'll be able to log in to the student portal</li>
              <li>Access your courses and assignments</li>
              <li>Start your academic journey with EduManage</li>
            </ul>
            
            <p><strong>For Parents/Guardians:</strong> Your child has registered for EduManage. Please help them verify their email address to complete the registration process.</p>
            
            <p>If you didn't create this account, please ignore this email.</p>
            
            <p><strong>Having trouble?</strong> Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing EduManage!</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send teacher verification email
const sendTeacherVerificationEmail = async (teacherName, email, verificationToken) => {
  const emailTemplate = getTeacherVerificationEmailTemplate(teacherName, email, verificationToken);
  return await sendEmail(email, emailTemplate);
};

// Send student verification email
const sendStudentVerificationEmail = async (studentName, email, verificationToken) => {
  const emailTemplate = getStudentVerificationEmailTemplate(studentName, email, verificationToken);
  return await sendEmail(email, emailTemplate);
};

// Generate password reset token (same as verification token generation)
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Teacher password reset email template
const getTeacherPasswordResetEmailTemplate = (teacherName, email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}&role=teacher`;
  
  return {
    subject: 'EduManage - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #5c84ff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .highlight { color: #5c84ff; font-weight: bold; }
          .warning { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .security-notice { background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${teacherName}!</h2>
            <p>We received a request to reset the password for your EduManage teacher account.</p>
            
            <p><strong>Account Details:</strong></p>
            <ul>
              <li><span class="highlight">Name:</span> ${teacherName}</li>
              <li><span class="highlight">Email:</span> ${email}</li>
              <li><span class="highlight">Role:</span> Teacher</li>
              <li><span class="highlight">Request Time:</span> ${new Date().toLocaleString()}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
            </div>
            
            <div class="security-notice">
              <strong>Security Notice:</strong>
              <ul>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged</li>
                <li>Consider changing your password if you suspect unauthorized access</li>
              </ul>
            </div>
            
            <p><strong>Having trouble?</strong> Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>For security reasons, this link will expire in 1 hour.</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Student password reset email template
const getStudentPasswordResetEmailTemplate = (studentName, email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}&role=student`;
  
  return {
    subject: 'EduManage - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00b3ee; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .highlight { color: #00b3ee; font-weight: bold; }
          .warning { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .security-notice { background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${studentName}!</h2>
            <p>We received a request to reset the password for your EduManage student account.</p>
            
            <p><strong>Account Details:</strong></p>
            <ul>
              <li><span class="highlight">Name:</span> ${studentName}</li>
              <li><span class="highlight">Email:</span> ${email}</li>
              <li><span class="highlight">Role:</span> Student</li>
              <li><span class="highlight">Request Time:</span> ${new Date().toLocaleString()}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
            </div>
            
            <div class="security-notice">
              <strong>Security Notice:</strong>
              <ul>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged</li>
                <li>Consider changing your password if you suspect unauthorized access</li>
              </ul>
            </div>
            
            <p><strong>For Parents/Guardians:</strong> Your child requested a password reset for their EduManage account. Please assist them with this process if needed.</p>
            
            <p><strong>Having trouble?</strong> Copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>For security reasons, this link will expire in 1 hour.</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send teacher password reset email
const sendTeacherPasswordResetEmail = async (teacherName, email, resetToken) => {
  const emailTemplate = getTeacherPasswordResetEmailTemplate(teacherName, email, resetToken);
  return await sendEmail(email, emailTemplate);
};

// Send student password reset email
const sendStudentPasswordResetEmail = async (studentName, email, resetToken) => {
  const emailTemplate = getStudentPasswordResetEmailTemplate(studentName, email, resetToken);
  return await sendEmail(email, emailTemplate);
};

// License key email template for coaching centers
const getLicenseKeyEmailTemplate = (ownerName, centerName, licenseKey) => {
  return {
    subject: '🎉 Your Coaching Center License Key - EduManage',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; }
          .license-key-box { 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe); 
            border: 2px solid #10b981; 
            border-radius: 10px; 
            padding: 20px; 
            margin: 20px 0; 
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .license-key { 
            font-family: 'Courier New', monospace; 
            font-size: 18px; 
            font-weight: bold; 
            color: #059669; 
            letter-spacing: 2px;
            word-break: break-all;
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #d1d5db;
          }
          .important-note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
          }
          .usage-steps {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .step {
            display: flex;
            align-items: center;
            margin: 10px 0;
          }
          .step-number {
            background-color: #10b981;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
          }
          .footer { background-color: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to EduManage!</h1>
            <h2>Your Coaching Center is Ready</h2>
          </div>
          <div class="content">
            <h2>Dear ${ownerName},</h2>
            <p>Congratulations! Your coaching center "<strong>${centerName}</strong>" has been successfully registered with EduManage.</p>
            
            <div class="license-key-box">
              <h3>🔑 Your License Key</h3>
              <div class="license-key">${licenseKey}</div>
              <p><small>This is your unique coaching center license key</small></p>
            </div>

            <div class="important-note">
              <h4>⚠️ Important:</h4>
              <ul>
                <li>Keep this license key secure and confidential</li>
                <li>Students will need this key to register for your coaching center</li>
                <li>Do not share this key publicly - only provide it to legitimate students</li>
                <li>If compromised, contact us immediately for a new key</li>
              </ul>
            </div>

            <div class="usage-steps">
              <h3>📋 How Students Use Your License Key:</h3>
              <div class="step">
                <div class="step-number">1</div>
                <div>Students visit the EduManage registration page</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div>They enter your license key during registration</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div>System validates the key and links them to your center</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div>Students can now access your coaching center's features</div>
              </div>
            </div>

            <h3>🚀 Next Steps:</h3>
            <ul>
              <li>Complete your email verification (check for verification email)</li>
              <li>Share your license key with prospective students</li>
              <li>Set up your coaching center profile and courses</li>
              <li>Start managing students, teachers, and batches</li>
            </ul>

            <p>Welcome to the EduManage family! We're excited to help you manage your coaching center efficiently.</p>
          </div>
          <div class="footer">
            <p><strong>Need help?</strong> Contact our support team</p>
            <p>Email: support@edumanage.com | Phone: +91-XXXX-XXXX</p>
            <p>Best regards,<br>The EduManage Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send license key email to coaching center owner
const sendLicenseKeyEmail = async (ownerName, email, centerName, licenseKey) => {
  const emailTemplate = getLicenseKeyEmailTemplate(ownerName, centerName, licenseKey);
  return await sendEmail(email, emailTemplate);
};

module.exports = {
  sendTeacherWelcomeEmail,
  sendStudentWelcomeEmail,
  sendEmail,
  sendTestEmail,
  generateVerificationToken,
  sendTeacherVerificationEmail,
  sendStudentVerificationEmail,
  generatePasswordResetToken,
  sendTeacherPasswordResetEmail,
  sendStudentPasswordResetEmail,
  sendLicenseKeyEmail
};