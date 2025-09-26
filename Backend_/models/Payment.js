const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  // Order Details
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  orderAmount: {
    type: Number,
    required: true
  },
  orderCurrency: {
    type: String,
    default: 'INR'
  },
  
  // Student Details (optional for tutor registration)
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserStudent',
    required: false
  },
  
  // Payment Details
  paymentId: String,
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: String,
  paymentGateway: {
    type: String,
    default: 'CASHFREE'
  },
  
  // Transaction Details
  transactionId: String,
  gatewayOrderId: String,
  gatewayPaymentId: String,
  
  // Payment Purpose
  paymentType: {
    type: String,
    enum: ['TUITION_FEE', 'EXAM_FEE', 'REGISTRATION_FEE', 'BOOK_FEE', 'TUTOR_REGISTRATION', 'OTHER'],
    required: true
  },
  description: String,
  
  // Fees Details
  feeDetails: {
    month: String,
    year: String,
    semester: String,
    subjects: [String]
  },
  
  // Timestamps
  paymentDate: Date,
  dueDate: Date,
  
  // Refund Details
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundDate: Date,
  refundId: String,
  
  // Additional Info
  paymentNote: String,
  receiptUrl: String,
  
  // Cashfree specific fields
  cashfreeData: {
    signature: String,
    paymentLink: String,
    sessionId: String
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
PaymentSchema.index({ student: 1, paymentStatus: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.orderAmount.toFixed(2)}`;
});

// Method to check if payment is successful
PaymentSchema.methods.isSuccessful = function() {
  return this.paymentStatus === 'SUCCESS';
};

// Method to check if payment is pending
PaymentSchema.methods.isPending = function() {
  return this.paymentStatus === 'PENDING';
};

// Method to check if refund is possible
PaymentSchema.methods.canRefund = function() {
  return this.paymentStatus === 'SUCCESS' && this.refundAmount < this.orderAmount;
};

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;