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
      required: true,
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
    organization: {
      type: String,
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
  },
  { timestamps: true }
);

const TeacherModel = mongoose.model("UserTeacher", TeacherSchema);
module.exports = TeacherModel;