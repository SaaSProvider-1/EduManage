const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const Auth = require('../middleware/Auth');

// Student routes (require authentication)
router.post('/create-order', Auth, PaymentController.createPaymentOrder);
router.get('/history', Auth, PaymentController.getPaymentHistory);
router.get('/details/:orderId', Auth, PaymentController.getPaymentDetails);

// Public routes (no auth required for tutor registration)
router.post('/create-tutor-order', PaymentController.createTutorPaymentOrder);

// Payment callbacks (no auth required for webhooks)
router.post('/success', PaymentController.handlePaymentSuccess);
router.post('/webhook', PaymentController.paymentWebhook);

// Admin routes (would require admin auth in production)
router.post('/refund/:orderId', Auth, PaymentController.processRefund);

module.exports = router;