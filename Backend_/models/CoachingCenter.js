const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TenantSchema = new Schema(
  {
    // Owner Information
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    licenseKey: { type: String, unique: true },
    
    // Coaching Center Information
    centerName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String },
    yearEstablished: { type: Number },
    coachingType: { type: String, required: true },
    logoFile: { type: String }, // Path to uploaded logo
    
    // Subscription Information
    planType: { type: String, required: true, enum: ["standard", "premium"] },
    subscriptionStatus: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "expired"],
    },
    subscriptionStartDate: { type: Date, default: Date.now },
    subscriptionEndDate: { type: Date },

    // Payment Information
    paymentStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed"],
    },
    lastPaymentDate: { type: Date },
    paymentId: { type: String }, // Payment gateway payment ID
    orderId: { type: String }, // Payment gateway order ID

    // Account Status
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "active", "suspended", "inactive"],
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tenant", TenantSchema);
