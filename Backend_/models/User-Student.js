const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  studentPhone: {
    type: String,
  },
  dateOfJoining: {
    type: Date,
    required: true,
    default: Date.now,
  },
  photo: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  schoolName: {
    type: String,
    required: true,
  },
  lastSchoolAttended: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  motherName: {
    type: String,
    required: true,
  },
  guardianPhone: {
    type: String,
    required: true,
  },
  aadharNumber: {
    type: String,
    required: true,
  },
  aadharDocument: {
    type: String,
    required: true,
  },
  completeAddress: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true
  }
});

const UserStudent = mongoose.model('UserStudent', StudentSchema);

module.exports = UserStudent;