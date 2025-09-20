const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
  role: { type: String, default: "admin" },
  fullname: { type: String },
  profilePic: { type: String },
  phone: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
});

module.exports = mongoose.model("Admin", AdminSchema);