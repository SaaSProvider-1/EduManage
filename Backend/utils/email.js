import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({ // FIXED: removed 'r' from createTransporter
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Load email templates
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    return null;
  }
};

// Enhanced template variable replacement with conditional logic support
const replaceTemplateVariables = (template, data) => {
  let processedTemplate = template;
  
  // Helper function to handle nested object access (e.g., user.name)
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  };
  
  // Process conditional blocks ({{#if condition}}...{{/if}})
  // Handle both single conditions and nested conditions
  const processConditionals = (template, data) => {
    // Handle {{#if condition}}...{{/if}} blocks
    const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    template = template.replace(ifRegex, (match, condition, content) => {
      const conditionValue = getNestedValue(data, condition.trim()) || data[condition.trim()];
      return conditionValue ? content : '';
    });
    
    // Handle {{^condition}}...{{/condition}} blocks (if NOT condition)
    const notRegex = /\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    template = template.replace(notRegex, (match, condition, content) => {
      const conditionValue = getNestedValue(data, condition.trim()) || data[condition.trim()];
      return !conditionValue ? content : '';
    });
    
    // Handle {{condition}}...{{/condition}} blocks (simple conditional blocks)
    const conditionalRegex = /\{\{([^#^/][^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    template = template.replace(conditionalRegex, (match, condition, content) => {
      const conditionValue = getNestedValue(data, condition.trim()) || data[condition.trim()];
      return conditionValue ? content : '';
    });
    
    return template;
  };
  
  // Process each loops ({{#each items}}...{{/each}})
  const processEachLoops = (template, data) => {
    const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    template = template.replace(eachRegex, (match, arrayName, content) => {
      const array = getNestedValue(data, arrayName.trim()) || data[arrayName.trim()];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          // Replace variables within the loop content
          Object.keys(item).forEach(key => {
            const itemRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemContent = itemContent.replace(itemRegex, item[key] || '');
          });
          return itemContent;
        }).join('');
      }
      return '';
    });
    
    return template;
  };
  
  // Process conditionals and loops first
  processedTemplate = processConditionals(processedTemplate, data);
  processedTemplate = processEachLoops(processedTemplate, data);
  
  // Replace simple variables {{variable}} or {{object.property}}
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Handle nested object properties
      Object.keys(value).forEach(nestedKey => {
        const nestedRegex = new RegExp(`\\{\\{${key}\\.${nestedKey}\\}\\}`, 'g');
        processedTemplate = processedTemplate.replace(nestedRegex, value[nestedKey] || '');
      });
    } else if (!Array.isArray(value)) {
      // Handle simple variables
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, value || '');
    }
  });
  
  // Clean up any remaining template syntax that wasn't processed
  processedTemplate = processedTemplate.replace(/\{\{[^}]+\}\}/g, '');
  
  return processedTemplate;
};

// Enhanced data preparation with default values
const prepareEmailData = (data = {}) => {
  const currentDate = new Date();
  
  const defaultData = {
    // Company information
    companyName: process.env.COMPANY_NAME || 'CoachingPro',
    companyDomain: process.env.COMPANY_DOMAIN || 'coachingpro.com',
    websiteUrl: process.env.CLIENT_URL || process.env.WEBSITE_URL,
    
    // Contact information
    supportEmail: process.env.SUPPORT_EMAIL || 'support@coachingpro.com',
    supportPhone: process.env.SUPPORT_PHONE,
    securityEmail: process.env.SECURITY_EMAIL || 'security@coachingpro.com',
    emergencyPhone: process.env.EMERGENCY_PHONE,
    
    // Sender information
    fromEmail: process.env.EMAIL_FROM,
    senderEmail: process.env.EMAIL_FROM,
    emailFromName: process.env.EMAIL_FROM_NAME || 'CoachingPro',
    
    // Date and time
    currentYear: currentDate.getFullYear(),
    currentDate: currentDate.toLocaleDateString(),
    currentTime: currentDate.toLocaleTimeString(),
    timestamp: currentDate.toISOString(),
    
    // Default expiration times
    expirationMinutes: 10,
    expiresIn: '10 minutes',
    
    // Default messages
    customMessage: '',
    closingMessage: '',
    
    // Technical defaults
    currency: '₹',
    arrivalTime: 15
  };
  
  // Merge with provided data, with provided data taking precedence
  return { ...defaultData, ...data };
};

// Email templates (if files don't exist)
const defaultTemplates = {
  emailVerification: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .code-box { background: #f8f9fa; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: monospace; }
            .button { display: inline-block; padding: 15px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 25px; margin: 15px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 {{companyName}}</h1>
                <p>Email Verification Required</p>
            </div>
            <div class="content">
                <h2>Hello {{name}}{{firstName}}{{username}}!</h2>
                <p>Thank you for registering with {{companyName}}. Please verify your email address to complete your registration:</p>
                
                <div class="code-box">
                    <p>Your verification code is:</p>
                    <div class="code">{{verificationCode}}{{otp}}{{token}}</div>
                </div>
                
                <p>This verification code will expire in {{expiresIn}}.</p>
                
                <div style="text-align: center;">
                    <a href="{{verificationUrl}}{{verificationLink}}{{resetUrl}}" class="button">Verify Email Address</a>
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> If you didn't create an account with us, please ignore this email.
                    Never share your verification code with anyone.
                </div>
                
                <p><strong>Need help?</strong> Contact us at {{supportEmail}}</p>
            </div>
            <div class="footer">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `,
  
  loginOTP: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Login OTP</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: #28a745; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .otp-box { background: #d1ecf1; border: 2px dashed #28a745; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .otp { font-size: 36px; font-weight: bold; color: #28a745; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; color: #721c24; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 {{companyName}}</h1>
                <p>One-Time Password</p>
            </div>
            <div class="content">
                <h2>Hello {{name}}{{firstName}}{{username}},</h2>
                <p>Your login OTP is:</p>
                <div class="otp-box">
                    <div class="otp">{{otp}}{{otpCode}}{{verificationCode}}{{token}}</div>
                </div>
                <p>This OTP will expire in {{expiresIn}}.</p>
                
                <div class="warning">
                    <strong>Security Warning:</strong><br>
                    • Never share this OTP with anyone<br>
                    • Use only on the official {{companyName}} website<br>
                    • If you didn't request this, contact support immediately
                </div>
                
                <p><strong>Need help?</strong> Contact {{supportEmail}}</p>
            </div>
            <div class="footer">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
                <p>This is an automated security message.</p>
            </div>
        </div>
    </body>
    </html>
  `,
  
  passwordReset: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .code-box { background: #fff3cd; border: 2px dashed #ffc107; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #856404; letter-spacing: 5px; font-family: monospace; }
            .button { display: inline-block; padding: 15px 35px; background: #dc2626; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-size: 16px; }
            .warning { background: #f8d7da; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
            .security { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 {{companyName}}</h1>
                <p>Password Reset Request</p>
            </div>
            <div class="content">
                <h2>Hello {{name}}{{firstName}}{{username}},</h2>
                <p>We received a request to reset your password. Use the code below or click the button to reset it:</p>
                
                <div class="code-box">
                    <p>Your password reset code is:</p>
                    <div class="code">{{resetCode}}{{verificationCode}}{{otp}}{{token}}</div>
                </div>
                
                <p>This reset code will expire in {{expiresIn}}.</p>
                
                <div style="text-align: center;">
                    <a href="{{resetUrl}}{{resetLink}}{{verificationUrl}}" class="button">Reset Password</a>
                </div>
                
                <div class="security">
                    <strong>🔒 Security Information:</strong><br>
                    • This code/link is valid for {{expiresIn}} only<br>
                    • Never share your reset code with anyone<br>
                    • Use only on the official {{companyName}} website<br>
                    • If you didn't request this, you can safely ignore this email
                </div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged. 
                    If you're concerned about account security, please contact our support team immediately.
                </div>
                
                <p><strong>Need help?</strong> Contact us at {{supportEmail}} or {{supportPhone}}</p>
            </div>
            <div class="footer">
                <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
                <p>This is an automated security email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
  `,
  
  welcome: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to CoachingPro</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to CoachingPro!</h1>
            </div>
            <div class="content">
                <h2>Hello {{name}},</h2>
                <p>Welcome to CoachingPro! Your account has been created successfully.</p>
                <p><strong>Email:</strong> {{email}}</p>
                <p><strong>Role:</strong> {{role}}</p>
                <p>You can now login to your dashboard using the link below:</p>
                <a href="{{loginUrl}}" class="button">Login to Dashboard</a>
                <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 CoachingPro. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `
};

// Main email sending function with enhanced error handling
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let htmlContent = '';
    
    if (options.template) {
      // Try to load template from file first
      let template = await loadTemplate(options.template);
      
      // If file doesn't exist, use default template
      if (!template && defaultTemplates[options.template]) {
        template = defaultTemplates[options.template];
        console.log(`Using fallback template for: ${options.template}`);
      }
      
      if (template && options.data) {
        // Prepare enhanced data with defaults
        const enhancedData = prepareEmailData(options.data);
        htmlContent = replaceTemplateVariables(template, enhancedData);
      } else if (!template) {
        console.warn(`Template not found: ${options.template}`);
        throw new Error(`Email template '${options.template}' not found`);
      }
    }
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'CoachingPro'} <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: htmlContent || options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send bulk emails with enhanced error handling
export const sendBulkEmails = async (emailList) => {
  const results = [];
  
  for (const emailOptions of emailList) {
    try {
      const result = await sendEmail(emailOptions);
      results.push({ 
        success: true, 
        messageId: result.messageId, 
        recipient: emailOptions.to,
        template: emailOptions.template 
      });
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message, 
        recipient: emailOptions.to,
        template: emailOptions.template 
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`Bulk email results: ${successCount} sent, ${failureCount} failed`);
  
  return {
    results,
    summary: {
      total: results.length,
      sent: successCount,
      failed: failureCount
    }
  };
};

// Send email with template - convenience function
export const sendTemplatedEmail = async (to, template, data, subject, options = {}) => {
  return await sendEmail({
    to,
    template,
    data,
    subject,
    ...options
  });
};

// Common email templates functions
export const sendWelcomeEmail = async (userEmail, userData) => {
  return await sendTemplatedEmail(
    userEmail,
    'welcome',
    {
      name: userData.name || userData.firstName || userData.username,
      firstName: userData.firstName || userData.name,
      username: userData.username,
      email: userData.email || userEmail,
      role: userData.role,
      loginUrl: `${process.env.CLIENT_URL}/login`,
      ...userData
    },
    `Welcome to ${userData.companyName || 'CoachingPro'}`
  );
};

export const sendEmailVerification = async (userEmail, verificationData) => {
  return await sendTemplatedEmail(
    userEmail,
    'emailVerification',
    {
      name: verificationData.name || verificationData.firstName || verificationData.username,
      firstName: verificationData.firstName || verificationData.name,
      username: verificationData.username,
      verificationCode: verificationData.verificationCode || verificationData.otp || verificationData.token,
      otp: verificationData.otp || verificationData.verificationCode || verificationData.token,
      token: verificationData.token || verificationData.verificationCode || verificationData.otp,
      verificationUrl: verificationData.verificationUrl || verificationData.verificationLink || verificationData.resetUrl,
      verificationLink: verificationData.verificationLink || verificationData.verificationUrl || verificationData.resetUrl,
      resetUrl: verificationData.resetUrl || verificationData.verificationUrl || verificationData.verificationLink,
      expirationMinutes: verificationData.expirationMinutes || '15',
      expiresIn: verificationData.expiresIn || `${verificationData.expirationMinutes || 15} minutes`,
      ...verificationData
    },
    'Please verify your email address'
  );
};

export const sendPasswordReset = async (userEmail, resetData) => {
  return await sendTemplatedEmail(
    userEmail,
    'passwordReset',
    {
      name: resetData.name || resetData.firstName || resetData.username,
      firstName: resetData.firstName || resetData.name,
      username: resetData.username,
      resetCode: resetData.resetCode || resetData.verificationCode || resetData.otp || resetData.token,
      verificationCode: resetData.verificationCode || resetData.resetCode || resetData.otp || resetData.token,
      otp: resetData.otp || resetData.resetCode || resetData.verificationCode || resetData.token,
      token: resetData.token || resetData.resetCode || resetData.verificationCode || resetData.otp,
      resetUrl: resetData.resetUrl || resetData.verificationUrl || resetData.resetLink,
      resetLink: resetData.resetLink || resetData.resetUrl || resetData.verificationUrl,
      verificationUrl: resetData.verificationUrl || resetData.resetUrl || resetData.resetLink,
      expirationMinutes: resetData.expirationMinutes || '15',
      expiresIn: resetData.expiresIn || `${resetData.expirationMinutes || 15} minutes`,
      expiryTime: resetData.expiryTime,
      requestTime: resetData.requestTime || new Date().toLocaleString(),
      timestamp: resetData.timestamp || new Date().toISOString(),
      ipAddress: resetData.ipAddress,
      userAgent: resetData.userAgent,
      browserInfo: resetData.browserInfo || resetData.userAgent,
      location: resetData.location,
      ...resetData
    },
    'Password Reset Request'
  );
};

export const sendOTPVerification = async (userEmail, otpData) => {
  return await sendTemplatedEmail(
    userEmail,
    'otpVerification',
    {
      name: otpData.name || otpData.firstName || otpData.username,
      firstName: otpData.firstName || otpData.name,
      username: otpData.username,
      otp: otpData.otp || otpData.otpCode || otpData.verificationCode || otpData.token,
      otpCode: otpData.otpCode || otpData.otp || otpData.verificationCode || otpData.token,
      verificationCode: otpData.verificationCode || otpData.otp || otpData.otpCode || otpData.token,
      token: otpData.token || otpData.otp || otpData.otpCode || otpData.verificationCode,
      purpose: otpData.purpose || 'account verification',
      purposeTitle: otpData.purposeTitle || otpData.purpose,
      otpLabel: otpData.otpLabel || 'OTP',
      expirationMinutes: otpData.expirationMinutes || '5',
      expiresIn: otpData.expiresIn || `${otpData.expirationMinutes || 5} minutes`,
      expiryTime: otpData.expiryTime,
      requestTime: otpData.requestTime || new Date().toLocaleString(),
      timestamp: otpData.timestamp || new Date().toISOString(),
      email: otpData.email || userEmail,
      phoneNumber: otpData.phoneNumber,
      ipAddress: otpData.ipAddress,
      userAgent: otpData.userAgent,
      deviceInfo: otpData.deviceInfo || otpData.userAgent,
      location: otpData.location,
      resendDelay: otpData.resendDelay || '2',
      ...otpData
    },
    `Your OTP for ${otpData.purpose || 'verification'}`
  );
};

export const sendExamNotification = async (studentEmail, examData) => {
  return await sendTemplatedEmail(
    studentEmail,
    'examNotification',
    examData,
    `${examData.notificationType || 'Exam Notification'}: ${examData.examTitle}`
  );
};

export const sendFeeReminder = async (recipientEmail, feeData) => {
  const reminderType = feeData.isOverdue ? 'Overdue Notice' : 'Payment Reminder';
  return await sendTemplatedEmail(
    recipientEmail,
    'feeReminder',
    feeData,
    `Fee ${reminderType} - ${feeData.companyName || 'CoachingPro'}`
  );
};

export const sendNotification = async (recipientEmail, notificationData) => {
  return await sendTemplatedEmail(
    recipientEmail,
    'notification',
    notificationData,
    notificationData.subject || 'New Notification'
  );
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration verification failed:', error);
    return { success: false, error: error.message };
  }
};

// Test email function
export const sendTestEmail = async (to) => {
  const testData = {
    name: 'Test User',
    companyName: 'CoachingPro',
    testMessage: 'This is a test email to verify email configuration.'
  };

  return await sendEmail({
    to,
    subject: 'Email Configuration Test',
    html: `
      <h2>Email Test Successful!</h2>
      <p>Hello ${testData.name},</p>
      <p>${testData.testMessage}</p>
      <p>If you received this email, your email configuration is working correctly.</p>
      <hr>
      <p><small>© ${new Date().getFullYear()} ${testData.companyName}. All rights reserved.</small></p>
    `
  });
};

export default {
  sendEmail,
  sendBulkEmails,
  sendTemplatedEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordReset,
  sendOTPVerification,
  sendExamNotification,
  sendFeeReminder,
  sendNotification,
  verifyEmailConfig,
  sendTestEmail
};