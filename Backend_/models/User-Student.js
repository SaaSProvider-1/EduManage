const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  role: { type: String, default: "student" },

  // Personal Details
  name: { type: String, required: true },
  bloodGroup: { type: String },
  profilePic: { type: String },

  // Contact Details
  contact: {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      sparse: true, // This allows unique constraint even with null values
      validate: {
        validator: function(email) {
          return email && email.trim().length > 0;
        },
        message: 'Email cannot be empty'
      }
    },
    phone: { type: String },
    parentPhone: { type: String, required: true },
  },

  // Academic Details
  dateOfJoining: { type: Date, default: Date.now },
  class: { type: String, required: true },
  currSchool: { type: String, required: true },
  lastSchool: { type: String },

  // Academic Performance
  academicPerformance: {
    subjects: [{
      name: { type: String, required: true },
      score: { type: Number, min: 0, max: 100 },
      grade: { type: String },
      semester: { type: String },
      year: { type: String }
    }],
    overallGPA: { type: Number, min: 0, max: 10 },
    overallPercentage: { type: Number, min: 0, max: 100 },
    rank: { type: Number },
    totalStudents: { type: Number }
  },

  // Parental Details
  parents: {
    father: { type: String, required: true },
    mother: { type: String, required: true },
  },

  // Document Details
  aadhar: {
    number: { type: String },
    url: { type: String },
  },

  // Address Details
  address: { type: String, required: true },

  // Security Details
  password: { type: String, required: true, select: false },

  // Email Verification Fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },

  // Password Reset Fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

const UserStudent = mongoose.model("UserStudent", StudentSchema);

module.exports = UserStudent;
