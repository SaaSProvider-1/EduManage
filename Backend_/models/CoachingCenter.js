const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CoachingCenterSchema = new Schema({
    // Basic Information
    centerName: { type: String, required: true },
    description: { type: String },
    
    // Owner/Tenant Reference
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    
    // License System
    licenseKey: { type: String, required: true, unique: true },
    
    // Location Information
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String },
    
    // Contact Information
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    
    // Academic Information
    coachingType: { 
        type: String, 
        required: true,
        enum: ['academic', 'competitive', 'professional', 'language', 'skill', 'other']
    },
    subjects: [{ type: String }],
    classesOffered: [{ type: String }],
    yearEstablished: { type: Number },
    
    // Media
    logo: { type: String },
    images: [{ type: String }],
    
    // Capacity and Limits
    maxStudents: { type: Number, default: 100 },
    maxTeachers: { type: Number, default: 30 },
    currentStudentCount: { type: Number, default: 0 },
    currentTeacherCount: { type: Number, default: 0 },
    
    // Status and Approval
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'approved', 'active', 'suspended', 'inactive'] 
    },
    isVisible: { type: Boolean, default: true }, // For student registration visibility
    
    // Additional Features
    facilities: [{ type: String }],
    timings: {
        openTime: { type: String },
        closeTime: { type: String },
        workingDays: [{ type: String }]
    },
    
    // Fees Structure
    registrationFee: { type: Number, default: 0 },
    monthlyFee: { type: Number, default: 0 },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index for efficient queries
CoachingCenterSchema.index({ tenantId: 1, status: 1 });
CoachingCenterSchema.index({ city: 1, state: 1, isVisible: 1 });
CoachingCenterSchema.index({ coachingType: 1, isVisible: 1 });

module.exports = mongoose.model("CoachingCenter", CoachingCenterSchema);