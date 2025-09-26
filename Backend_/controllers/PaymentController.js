const Payment = require('../models/Payment');
const UserStudent = require('../models/User-Student');
const cashfreeService = require('../config/cashfreeService');
const { v4: uuidv4 } = require('uuid');

// Create payment order for students (requires authentication)
const createPaymentOrder = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      amount,
      paymentType,
      description,
      feeDetails,
      dueDate
    } = req.body;

    // Validate required fields
    if (!amount || !paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment type are required'
      });
    }

    // Get student details
    const student = await UserStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate unique order ID
    const orderId = `EDU_${Date.now()}_${uuidv4().substr(0, 8)}`;

    // Create payment record in database
    const payment = new Payment({
      orderId,
      orderAmount: amount,
      student: studentId,
      paymentType,
      description,
      feeDetails,
      dueDate: dueDate ? new Date(dueDate) : null,
      paymentStatus: 'PENDING'
    });

    await payment.save();

    // Create Cashfree payment order
    const cashfreeOrder = await cashfreeService.createPaymentOrder({
      orderId,
      orderAmount: amount,
      customerName: student.name,
      customerEmail: student.contact.email,
      customerPhone: student.contact.phone || student.contact.parentPhone,
      returnUrl: `${req.protocol}://${req.get('host')}/payment/success`,
      notifyUrl: `${req.protocol}://${req.get('host')}/api/payment/webhook`
    });

    if (!cashfreeOrder.success) {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(payment._id, { paymentStatus: 'FAILED' });
      
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order',
        error: cashfreeOrder.message
      });
    }

    // Update payment record with Cashfree data
    await Payment.findByIdAndUpdate(payment._id, {
      'cashfreeData.paymentLink': cashfreeOrder.paymentUrl,
      'cashfreeData.sessionId': cashfreeOrder.data.order_token || cashfreeOrder.data.cftoken
    });

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId,
        amount,
        paymentUrl: cashfreeOrder.paymentUrl,
        orderToken: cashfreeOrder.data.order_token || cashfreeOrder.data.cftoken
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create payment order for tutor registration (no authentication required)
const createTutorPaymentOrder = async (req, res) => {
  try {
    const {
      amount,
      paymentType,
      description,
      customerDetails,
      planDetails
    } = req.body;

    // Validate required fields
    if (!amount || !customerDetails || !customerDetails.email || !customerDetails.name) {
      return res.status(400).json({
        success: false,
        message: 'Amount and customer details are required'
      });
    }

    // Generate unique order ID
    const orderId = `TUTOR_${Date.now()}_${uuidv4().substr(0, 8)}`;

    // Create payment record in database (without student reference)
    const payment = new Payment({
      orderId,
      orderAmount: amount,
      student: null, // No student for tutor registration
      paymentType: paymentType || 'TUTOR_REGISTRATION',
      description: description || 'Tutor registration payment',
      feeDetails: planDetails,
      paymentStatus: 'PENDING'
    });

    await payment.save();

    // Create Cashfree payment order
    const cashfreeOrder = await cashfreeService.createPaymentOrder({
      orderId,
      orderAmount: amount,
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      returnUrl: `${req.protocol}://${req.get('host')}/payment/success`,
      notifyUrl: `${req.protocol}://${req.get('host')}/api/payment/webhook`
    });

    if (!cashfreeOrder.success) {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(payment._id, { paymentStatus: 'FAILED' });
      
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order',
        error: cashfreeOrder.message
      });
    }

    // Update payment record with Cashfree data
    await Payment.findByIdAndUpdate(payment._id, {
      'cashfreeData.paymentLink': cashfreeOrder.paymentUrl,
      'cashfreeData.sessionId': cashfreeOrder.data.order_token || cashfreeOrder.data.cftoken
    });

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId,
        amount,
        paymentUrl: cashfreeOrder.paymentUrl,
        orderToken: cashfreeOrder.data.order_token || cashfreeOrder.data.cftoken
      }
    });

  } catch (error) {
    console.error('Create tutor payment order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Handle payment success callback
const handlePaymentSuccess = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Verify signature
    if (!cashfreeService.verifyPaymentSignature(req.body, signature)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment status from Cashfree
    const paymentStatus = await cashfreeService.getPaymentStatus(orderId);
    
    if (!paymentStatus.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to verify payment status'
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        paymentStatus: paymentStatus.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        paymentId,
        transactionId: req.body.transactionId,
        gatewayPaymentId: req.body.gatewayPaymentId,
        paymentDate: new Date(),
        paymentMethod: req.body.paymentMethod
      },
      { new: true }
    ).populate('student', 'name contact.email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      message: payment.paymentStatus === 'SUCCESS' ? 'Payment successful' : 'Payment failed',
      data: {
        orderId,
        status: payment.paymentStatus,
        amount: payment.orderAmount,
        paymentDate: payment.paymentDate
      }
    });

  } catch (error) {
    console.error('Payment success handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment callback'
    });
  }
};

// Get payment history for student
const getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10, status, paymentType } = req.query;

    const query = { student: studentId };
    if (status) query.paymentStatus = status;
    if (paymentType) query.paymentType = paymentType;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('student', 'name contact.email');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

// Get payment details by order ID
const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const studentId = req.user.id;

    const payment = await Payment.findOne({ 
      orderId, 
      student: studentId 
    }).populate('student', 'name contact.email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
};

// Process refund (for admin use)
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount, refundReason } = req.body;

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (!payment.canRefund()) {
      return res.status(400).json({
        success: false,
        message: 'Refund not possible for this payment'
      });
    }

    // Process refund through Cashfree
    const refundResult = await cashfreeService.processRefund(
      orderId, 
      refundAmount, 
      refundReason
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process refund',
        error: refundResult.message
      });
    }

    // Update payment record
    await Payment.findByIdAndUpdate(payment._id, {
      refundAmount: (payment.refundAmount || 0) + refundAmount,
      refundReason,
      refundDate: new Date(),
      refundId: refundResult.refundId,
      paymentStatus: refundAmount >= payment.orderAmount ? 'REFUNDED' : payment.paymentStatus
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.refundId,
        refundAmount
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
};

// Webhook handler for payment notifications
const paymentWebhook = async (req, res) => {
  try {
    const { orderId, txStatus, paymentMode, txMsg, txTime, signature } = req.body;

    // Verify webhook signature
    if (!cashfreeService.verifyPaymentSignature(req.body, signature)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Update payment status
    let paymentStatus = 'PENDING';
    if (txStatus === 'SUCCESS') paymentStatus = 'SUCCESS';
    else if (txStatus === 'FAILED') paymentStatus = 'FAILED';
    else if (txStatus === 'CANCELLED') paymentStatus = 'CANCELLED';

    await Payment.findOneAndUpdate(
      { orderId },
      {
        paymentStatus,
        paymentMethod: paymentMode,
        paymentDate: txStatus === 'SUCCESS' ? new Date(txTime) : undefined,
        paymentNote: txMsg
      }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  createPaymentOrder,
  createTutorPaymentOrder,
  handlePaymentSuccess,
  getPaymentHistory,
  getPaymentDetails,
  processRefund,
  paymentWebhook
};