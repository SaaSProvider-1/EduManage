import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Type and Category
  type: {
    type: String,
    enum: [
      'attendance', 'fee_reminder', 'fee_payment', 'exam_scheduled', 'exam_result',
      'announcement', 'teacher_absent', 'class_cancelled', 'schedule_change',
      'assignment', 'deadline_reminder', 'birthday', 'holiday', 'maintenance',
      'security_alert', 'system_update', 'parent_meeting', 'performance_report',
      'achievement', 'warning', 'suspension', 'enrollment', 'batch_completion',
      'certificate', 'feedback_request', 'event', 'other'
    ],
    required: [true, 'Type is required']
  },
  category: {
    type: String,
    enum: ['academic', 'financial', 'administrative', 'emergency', 'promotional', 'social'],
    required: [true, 'Category is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Sender and Recipients
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  
  // Recipients can be individuals or groups
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student', 'parent']
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    readAt: Date,
    deliveredAt: Date,
    isRead: {
      type: Boolean,
      default: false
    },
    isDelivered: {
      type: Boolean,
      default: false
    }
  }],
  
  // Targeting Options
  targetAudience: {
    roles: [String],
    batches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    }],
    grades: [String],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    excludeUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Content and Media
  content: {
    html: String,
    attachments: [{
      fileName: String,
      fileType: String,
      fileSize: Number,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    images: [String],
    links: [{
      title: String,
      url: String,
      description: String
    }]
  },
  
  // Delivery Channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    whatsapp: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  
  // Scheduling
  scheduleDate: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'draft'
  },
  
  // Delivery Statistics
  deliveryStats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    read: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    }
  },
  
  // Interaction Tracking
  interactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['delivered', 'read', 'clicked', 'replied', 'shared', 'archived', 'deleted']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Related Entities
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['batch', 'exam', 'fee', 'attendance', 'user', 'announcement']
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityData: mongoose.Schema.Types.Mixed
  },
  
  // Expiry and Persistence
  expiresAt: Date,
  isPersistent: {
    type: Boolean,
    default: true
  },
  
  // Reply and Response
  allowReplies: {
    type: Boolean,
    default: false
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Approval Workflow (for sensitive notifications)
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  
  // Templates
  templateId: String,
  templateVariables: mongoose.Schema.Types.Mixed,
  
  // A/B Testing
  abTestId: String,
  variant: String,
  
  // Tags and Metadata
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ sender: 1 });
notificationSchema.index({ 'recipients.user': 1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduleDate: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'recipients.isRead': 1 });

// Virtuals
notificationSchema.virtual('readPercentage').get(function() {
  if (this.deliveryStats.totalRecipients === 0) return 0;
  return Math.round((this.deliveryStats.read / this.deliveryStats.totalRecipients) * 100);
});

notificationSchema.virtual('deliveryPercentage').get(function() {
  if (this.deliveryStats.totalRecipients === 0) return 0;
  return Math.round((this.deliveryStats.delivered / this.deliveryStats.totalRecipients) * 100);
});

notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Update total recipients
  this.deliveryStats.totalRecipients = this.recipients.length;
  
  // Update delivery stats
  this.deliveryStats.delivered = this.recipients.filter(r => r.isDelivered).length;
  this.deliveryStats.read = this.recipients.filter(r => r.isRead).length;
  
  // Auto-set schedule date if not provided
  if (!this.scheduleDate && this.status === 'scheduled') {
    this.scheduleDate = new Date();
  }
  
  next();
});

// Instance methods
notificationSchema.methods.addRecipient = function(userId, options = {}) {
  const existingIndex = this.recipients.findIndex(r => r.user.toString() === userId.toString());
  
  if (existingIndex === -1) {
    this.recipients.push({
      user: userId,
      ...options
    });
  } else {
    this.recipients[existingIndex] = { ...this.recipients[existingIndex], ...options };
  }
  
  return this.save();
};

notificationSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && !recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = new Date();
    
    // Track interaction
    this.interactions.push({
      user: userId,
      action: 'read',
      timestamp: new Date()
    });
    
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.markAsDelivered = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && !recipient.isDelivered) {
    recipient.isDelivered = true;
    recipient.deliveredAt = new Date();
    
    // Track interaction
    this.interactions.push({
      user: userId,
      action: 'delivered',
      timestamp: new Date()
    });
    
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.trackClick = function(userId, metadata = {}) {
  this.interactions.push({
    user: userId,
    action: 'clicked',
    timestamp: new Date(),
    metadata
  });
  
  this.deliveryStats.clicked += 1;
  return this.save();
};

notificationSchema.methods.addReply = function(userId, message) {
  if (!this.allowReplies) {
    throw new Error('Replies are not allowed for this notification');
  }
  
  this.replies.push({
    user: userId,
    message,
    timestamp: new Date()
  });
  
  return this.save();
};

notificationSchema.methods.approve = function(approvedBy) {
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalStatus = 'approved';
  
  if (this.status === 'draft') {
    this.status = 'scheduled';
  }
  
  return this.save();
};

notificationSchema.methods.reject = function(rejectedBy, reason = '') {
  this.approvalStatus = 'rejected';
  this.metadata = { ...this.metadata, rejectionReason: reason, rejectedBy };
  this.status = 'cancelled';
  
  return this.save();
};

// Static methods
notificationSchema.statics.findForUser = function(userId, options = {}) {
  const query = {
    $or: [
      { 'recipients.user': userId },
      { 'targetAudience.specificUsers': userId }
    ]
  };
  
  if (options.unreadOnly) {
    query['recipients.isRead'] = false;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .populate('sender', 'firstName lastName role')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.findByRole = function(role, options = {}) {
  const query = {
    $or: [
      { 'recipients.role': role },
      { 'targetAudience.roles': role }
    ],
    status: 'sent'
  };
  
  return this.find(query)
    .populate('sender', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

notificationSchema.statics.findPending = function() {
  return this.find({
    status: 'scheduled',
    scheduleDate: { $lte: new Date() },
    approvalStatus: 'approved'
  });
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    'recipients.user': userId,
    'recipients.isRead': false,
    status: 'sent'
  });
};

notificationSchema.statics.getDeliveryReport = function(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'sent'
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        totalNotifications: { $sum: 1 },
        totalRecipients: { $sum: '$deliveryStats.totalRecipients' },
        totalDelivered: { $sum: '$deliveryStats.delivered' },
        totalRead: { $sum: '$deliveryStats.read' },
        totalClicked: { $sum: '$deliveryStats.clicked' }
      }
    },
    {
      $addFields: {
        deliveryRate: {
          $multiply: [
            { $divide: ['$totalDelivered', '$totalRecipients'] },
            100
          ]
        },
        readRate: {
          $multiply: [
            { $divide: ['$totalRead', '$totalRecipients'] },
            100
          ]
        },
        clickRate: {
          $multiply: [
            { $divide: ['$totalClicked', '$totalRecipients'] },
            100
          ]
        }
      }
    }
  ]);
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;