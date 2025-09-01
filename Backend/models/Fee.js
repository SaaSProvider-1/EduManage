import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  
  // Fee Details
  feeType: {
    type: String,
    enum: ['monthly', 'quarterly', 'semester', 'annual', 'registration', 'exam', 'material', 'late_fee', 'other'],
    required: [true, 'Fee type is required']
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Period Information
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  forMonth: {
    type: Number,
    min: 1,
    max: 12
  },
  forYear: {
    type: Number,
    min: 2020,
    max: 2099
  },
  academicYear: String,
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Payment Information
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  
  // Payment Details
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'bank_transfer', 'wallet'],
      required: true
    },
    transactionId: String,
    reference: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receipt: {
      number: String,
      url: String
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'cancelled'],
      default: 'confirmed'
    },
    remarks: String
  }],
  
  // Discounts and Penalties
  discounts: [{
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'scholarship', 'sibling', 'early_bird', 'loyalty', 'other']
    },
    amount: Number,
    percentage: Number,
    reason: String,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  penalties: [{
    type: {
      type: String,
      enum: ['late_fee', 'bounced_cheque', 'other']
    },
    amount: Number,
    reason: String,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Additional Information
  description: String,
  notes: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  
  // Generation and Updates
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notifications
  remindersSent: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'notification']
    },
    sentAt: Date,
    sentTo: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }],
  
  // Parent Information (for notifications)
  parentNotified: {
    type: Boolean,
    default: false
  },
  
  // Tax Information
  taxDetails: {
    isTaxable: {
      type: Boolean,
      default: false
    },
    taxAmount: Number,
    taxPercentage: Number,
    taxType: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
feeSchema.index({ student: 1, batch: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ forMonth: 1, forYear: 1 });
feeSchema.index({ createdAt: -1 });

// Virtuals
feeSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.dueDate < new Date();
});

feeSchema.virtual('totalDiscountAmount').get(function() {
  return this.discounts.reduce((sum, discount) => {
    return sum + (discount.amount || (this.amount * discount.percentage / 100));
  }, 0);
});

feeSchema.virtual('totalPenaltyAmount').get(function() {
  return this.penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
});

feeSchema.virtual('finalAmount').get(function() {
  return this.amount - this.totalDiscountAmount + this.totalPenaltyAmount;
});

feeSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
feeSchema.pre('save', function(next) {
  // Update balance amount
  this.balanceAmount = this.finalAmount - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount >= this.finalAmount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  
  next();
});

// Instance methods
feeSchema.methods.addPayment = function(paymentData, receivedBy) {
  this.payments.push({
    ...paymentData,
    receivedBy,
    paymentDate: paymentData.paymentDate || new Date()
  });
  
  this.paidAmount += paymentData.amount;
  this.lastUpdatedBy = receivedBy;
  
  return this.save();
};

feeSchema.methods.addDiscount = function(discountData, appliedBy) {
  this.discounts.push({
    ...discountData,
    appliedBy,
    appliedDate: new Date()
  });
  
  this.lastUpdatedBy = appliedBy;
  return this.save();
};

feeSchema.methods.addPenalty = function(penaltyData, appliedBy) {
  this.penalties.push({
    ...penaltyData,
    appliedBy,
    appliedDate: new Date()
  });
  
  this.lastUpdatedBy = appliedBy;
  return this.save();
};

feeSchema.methods.generateReceipt = function() {
  const receiptNumber = `RCP${this.createdAt.getFullYear()}${String(this.createdAt.getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-6)}`;
  return receiptNumber;
};

feeSchema.methods.sendReminder = async function(type = 'email', recipient) {
  this.remindersSent.push({
    type,
    sentAt: new Date(),
    sentTo: recipient,
    status: 'sent'
  });
  
  return this.save();
};

// Static methods
feeSchema.statics.findPendingFees = function(studentId = null) {
  const query = { status: { $in: ['pending', 'partial', 'overdue'] } };
  if (studentId) query.student = studentId;
  
  return this.find(query)
    .populate('student', 'firstName lastName studentId email')
    .populate('batch', 'name code')
    .sort({ dueDate: 1 });
};

feeSchema.statics.findOverdueFees = function() {
  return this.find({ 
    status: { $in: ['pending', 'partial'] },
    dueDate: { $lt: new Date() }
  })
  .populate('student', 'firstName lastName studentId email phone')
  .populate('batch', 'name code');
};

feeSchema.statics.getCollectionStats = function(startDate, endDate) {
  const matchStage = {
    'payments.paymentDate': {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$payments' },
    { $match: { 'payments.paymentDate': { $gte: new Date(startDate), $lte: new Date(endDate) } } },
    {
      $group: {
        _id: null,
        totalCollected: { $sum: '$payments.amount' },
        totalTransactions: { $sum: 1 },
        paymentMethods: {
          $push: '$payments.paymentMethod'
        }
      }
    }
  ]);
};

feeSchema.statics.getStudentFeeHistory = function(studentId) {
  return this.find({ student: studentId })
    .populate('batch', 'name code')
    .sort({ createdAt: -1 });
};

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;