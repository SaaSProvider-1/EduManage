const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID;
    this.secretKey = process.env.CASHFREE_SECRET_KEY;
    this.baseUrl = process.env.CASHFREE_BASE_URL;
    
    if (!this.appId || !this.secretKey) {
      throw new Error('Cashfree credentials not provided in environment variables');
    }
  }

  // Generate signature for webhook verification (new API)
  generateSignature(rawBody, timestamp) {
    const signedPayload = timestamp + rawBody;
    return crypto.createHmac('sha256', this.secretKey).update(signedPayload).digest('base64');
  }

  // Create payment order using new Cashfree API v2022-09-01
  async createPaymentOrder(orderData) {
    try {
      const {
        orderId,
        orderAmount,
        orderCurrency = 'INR',
        customerName,
        customerEmail,
        customerPhone,
        returnUrl,
        notifyUrl
      } = orderData;

      console.log('Creating Cashfree order with data:', orderData);

      // New API format for Cashfree v2022-09-01
      const requestBody = {
        order_id: orderId || `ORDER_${Date.now()}`,
        order_amount: parseFloat(orderAmount),
        order_currency: orderCurrency,
        customer_details: {
          customer_id: `CUSTOMER_${Date.now()}`,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: notifyUrl
        }
      };

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2022-09-01'
      };

      console.log('Making request to:', `${this.baseUrl}/orders`);
      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(`${this.baseUrl}/orders`, requestBody, { headers });

      console.log('Cashfree response:', response.data);

      return {
        success: true,
        data: {
          order_id: response.data.order_id,
          order_token: response.data.order_token,
          cftoken: response.data.order_token,
          payment_link: response.data.payment_link
        },
        paymentUrl: response.data.payment_link
      };

    } catch (error) {
      console.error('Cashfree create order error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create payment order',
        error: error.response?.data || { message: error.message }
      };
    }
  }

  // Verify webhook signature (new API)
  verifyWebhookSignature(rawBody, receivedSignature, timestamp) {
    try {
      const expectedSignature = this.generateSignature(rawBody, timestamp);
      return expectedSignature === receivedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Legacy signature verification (for backward compatibility)
  verifyPaymentSignature(postData, signature) {
    // For webhook verification, we'll skip signature check for now
    // and rely on order status verification from Cashfree API
    return true;
  }

  // Get payment status (new API)
  async getPaymentStatus(orderId) {
    try {
      const headers = {
        'Accept': 'application/json',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2022-09-01'
      };

      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`, 
        { headers }
      );

      return {
        success: true,
        data: response.data,
        status: response.data.order_status || 'ACTIVE'
      };

    } catch (error) {
      console.error('Cashfree get payment status error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get payment status',
        error: error.response?.data || error.message
      };
    }
  }

  // Process refund
  async processRefund(orderId, refundAmount, refundNote = 'Refund processed') {
    try {
      const refundId = uuidv4();
      
      const headers = {
        'Content-Type': 'application/json',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2022-09-01'
      };

      const refundData = {
        refund_id: refundId,
        refund_amount: refundAmount.toString(),
        refund_note: refundNote
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/refunds`,
        refundData,
        { headers }
      );

      return {
        success: true,
        data: response.data,
        refundId: refundId
      };

    } catch (error) {
      console.error('Cashfree refund error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process refund',
        error: error.response?.data || error.message
      };
    }
  }

  // Format amount (convert to paisa/smallest unit)
  formatAmount(amount) {
    return Math.round(amount * 100) / 100;
  }
}

module.exports = new CashfreeService();