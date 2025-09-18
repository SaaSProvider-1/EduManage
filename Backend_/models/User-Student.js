const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  role: { type: String, default: "student" },

  // Personal Details
  name: { type: String, required: true },
  bloodGroup: { type: String },
  profilePic: { type: String },

  // Contact Details
  contact: {
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    parentPhone: { type: String, required: true },
  },

  // Academic Details
  dateOfJoining: { type: Date, default: Date.now },
  class: { type: String, required: true },
  currSchool: { type: String, required: true },
  lastSchool: { type: String },

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
}, { timestamps: true });

const UserStudent = mongoose.model("UserStudent", StudentSchema);

module.exports = UserStudent;
