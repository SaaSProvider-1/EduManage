const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "teacher",
      required: true,
    },
    coachingCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachingCenter',
      required: true,
    },
    qualifications: {
      type: String,
      required: true,
    },
    specialization: {
      type: [String],
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    teacherId: {
      type: String,
    },
    assignedClasses: {
      type: String,
    },
    // Email Verification Fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    // Password Reset Fields
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

const TeacherModel = mongoose.model("UserTeacher", TeacherSchema);
module.exports = TeacherModel;