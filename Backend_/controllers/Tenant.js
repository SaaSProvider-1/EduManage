const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Tenant = require('../models/Tenant');
const CoachingCenter = require('../models/CoachingCenter');
const cloudinary = require('../config/Cloudinary');
const { generateLicenseKey, generateSimpleLicenseKey } = require('../utils/licenseUtils');
const { sendLicenseKeyEmail } = require('../config/emailService');

// Register new tenant with first coaching center
const registerTenant = async (req, res) => {
    try {
        console.log('=== TENANT REGISTRATION REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        
        const {
            // Owner Information
            ownerName,
            email,
            phone,
            password,
            
            // Coaching Center Information
            centerName,
            address,
            city,
            state,
            pinCode,
            yearEstablished,
            coachingType,
            
            // Plan Information
            planType
        } = req.body;

        console.log('Extracted data:', {
            ownerName, email, phone, centerName, address, city, state, coachingType, planType
        });

        // Check if tenant already exists
        const existingTenant = await Tenant.findOne({ email });
        if (existingTenant) {
            return res.status(400).json({
                success: false,
                message: 'A tenant with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Handle logo upload if provided
        let logoUrl = '';
        if (req.files && req.files.logo) {
            try {
                const result = await cloudinary.uploader.upload(req.files.logo.tempFilePath, {
                    folder: 'coaching-centers/logos',
                    resource_type: 'image'
                });
                logoUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Logo upload error:', uploadError);
                // Continue without logo rather than failing
            }
        }

        // Generate unique license key for the coaching center
        const licenseKey = generateSimpleLicenseKey();
        console.log('Generated license key:', licenseKey);

        // Set subscription end date based on plan
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now

        // Create email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create tenant
        const tenant = new Tenant({
            ownerName,
            email,
            phone,
            password: hashedPassword,
            licenseKey,
            planType,
            subscriptionEndDate,
            emailVerificationToken,
            emailVerificationExpires
        });

        const savedTenant = await tenant.save();

        // Set plan limits
        const planLimits = {
            standard: { maxStudents: 100, maxTeachers: 30 },
            premium: { maxStudents: 500, maxTeachers: 50 }
        };

        const limits = planLimits[planType] || planLimits.standard;

        // Create first coaching center
        const coachingCenter = new CoachingCenter({
            centerName,
            tenantId: savedTenant._id,
            licenseKey, // Add the same license key to coaching center
            address,
            city,
            state,
            pinCode,
            yearEstablished: yearEstablished ? parseInt(yearEstablished) : null,
            coachingType,
            logo: logoUrl,
            maxStudents: limits.maxStudents,
            maxTeachers: limits.maxTeachers,
            phone,
            email
        });

        const savedCenter = await coachingCenter.save();

        // Send license key email
        try {
            // Format license key for email display (with hyphens)
            const formattedLicenseKey = licenseKey.match(/.{1,8}/g).join('-');
            await sendLicenseKeyEmail(ownerName, email, centerName, formattedLicenseKey);
            console.log(`License key email sent to: ${email}`);
        } catch (emailError) {
            console.error('Failed to send license key email:', emailError);
            // Continue with registration even if email fails
        }

        console.log(`Verification token for ${email}: ${emailVerificationToken}`);

        res.status(201).json({
            success: true,
            message: 'Tenant and coaching center registered successfully! Please check your email for your license key.',
            data: {
                tenantId: savedTenant._id,
                licenseKey: licenseKey.match(/.{1,8}/g).join('-'), // Send formatted license key
                centerData: {
                    centerId: savedCenter._id,
                    centerName: savedCenter.centerName,
                    status: savedCenter.status
                }
            }
        });

    } catch (error) {
        console.error('Tenant registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login tenant
const loginTenant = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find tenant
        const tenant = await Tenant.findOne({ email });
        if (!tenant) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, tenant.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!tenant.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email address before logging in'
            });
        }

        // Check if account is active
        if (tenant.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Your account is not active. Please contact support.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { tenantId: tenant._id, email: tenant.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        // Get tenant's coaching centers
        const coachingCenters = await CoachingCenter.find({ 
            tenantId: tenant._id 
        }).select('centerName status isVisible currentStudentCount currentTeacherCount');

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                tenant: {
                    id: tenant._id,
                    ownerName: tenant.ownerName,
                    email: tenant.email,
                    phone: tenant.phone,
                    planType: tenant.planType,
                    subscriptionStatus: tenant.subscriptionStatus
                },
                coachingCenters
            }
        });

    } catch (error) {
        console.error('Tenant login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Add new coaching center to existing tenant
const addCoachingCenter = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const {
            centerName,
            address,
            city,
            state,
            pinCode,
            yearEstablished,
            coachingType,
            phone,
            email,
            description
        } = req.body;

        // Verify tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        // Handle logo upload if provided
        let logoUrl = '';
        if (req.files && req.files.logo) {
            try {
                const result = await cloudinary.uploader.upload(req.files.logo.tempFilePath, {
                    folder: 'coaching-centers/logos',
                    resource_type: 'image'
                });
                logoUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Logo upload error:', uploadError);
            }
        }

        // Set plan limits
        const planLimits = {
            standard: { maxStudents: 100, maxTeachers: 30 },
            premium: { maxStudents: 500, maxTeachers: 50 }
        };

        const limits = planLimits[tenant.planType] || planLimits.standard;

        // Create new coaching center
        const coachingCenter = new CoachingCenter({
            centerName,
            tenantId,
            address,
            city,
            state,
            pinCode,
            yearEstablished: yearEstablished ? parseInt(yearEstablished) : null,
            coachingType,
            phone,
            email,
            description,
            logo: logoUrl,
            maxStudents: limits.maxStudents,
            maxTeachers: limits.maxTeachers
        });

        const savedCenter = await coachingCenter.save();

        res.status(201).json({
            success: true,
            message: 'Coaching center added successfully',
            data: savedCenter
        });

    } catch (error) {
        console.error('Add coaching center error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while adding coaching center'
        });
    }
};

// Get all coaching centers for a tenant
const getTenantCoachingCenters = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const coachingCenters = await CoachingCenter.find({ tenantId })
            .populate('tenantId', 'ownerName email planType')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: coachingCenters
        });

    } catch (error) {
        console.error('Get tenant coaching centers error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching coaching centers'
        });
    }
};

// Get all active coaching centers (for student registration)
const getActiveCoachingCenters = async (req, res) => {
    try {
        const { city, state, coachingType } = req.query;

        // Build filter
        let filter = {
            status: 'active',
            isVisible: true
        };

        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (coachingType) filter.coachingType = coachingType;

        const coachingCenters = await CoachingCenter.find(filter)
            .populate('tenantId', 'ownerName email')
            .select('centerName address city state coachingType logo currentStudentCount maxStudents')
            .sort({ centerName: 1 });

        res.status(200).json({
            success: true,
            data: coachingCenters
        });

    } catch (error) {
        console.error('Get active coaching centers error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching coaching centers'
        });
    }
};

// Verify license key endpoint for real-time validation
const verifyLicenseKey = async (req, res) => {
    try {
        const { licenseKey } = req.body;

        if (!licenseKey || licenseKey.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "License key is required"
            });
        }

        // Clean and validate license key format
        const cleanLicenseKey = licenseKey.replace(/-/g, '').toUpperCase();
        if (!/^[A-F0-9]{64}$/.test(cleanLicenseKey)) {
            return res.status(400).json({
                success: false,
                message: "Invalid license key format"
            });
        }

        // Find coaching center with this license key
        const coachingCenter = await CoachingCenter.findOne({ licenseKey: cleanLicenseKey })
            .populate('tenantId', 'ownerName email planType subscriptionStatus');

        if (!coachingCenter) {
            return res.status(400).json({
                success: false,
                message: "Invalid license key. Please contact your coaching center for the correct key."
            });
        }

        if (coachingCenter.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "This coaching center is not currently active. Please contact support."
            });
        }

        // Check if the tenant's subscription is active
        if (coachingCenter.tenantId.subscriptionStatus !== 'active') {
            return res.status(400).json({
                success: false,
                message: "This coaching center's subscription is not active. Please contact the center owner."
            });
        }

        res.status(200).json({
            success: true,
            message: "License key verified successfully",
            coachingCenter: {
                id: coachingCenter._id,
                centerName: coachingCenter.centerName,
                city: coachingCenter.city,
                state: coachingCenter.state,
                coachingType: coachingCenter.coachingType,
                maxStudents: coachingCenter.maxStudents,
                currentStudentCount: coachingCenter.currentStudentCount,
                owner: coachingCenter.tenantId.ownerName,
                planType: coachingCenter.tenantId.planType
            }
        });

    } catch (error) {
        console.error('License key verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during license key verification'
        });
    }
};

module.exports = {
    registerTenant,
    loginTenant,
    addCoachingCenter,
    getTenantCoachingCenters,
    getActiveCoachingCenters,
    verifyLicenseKey
};