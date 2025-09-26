const API_BASE_URL = 'http://localhost:3000/api';

// Payment Service for frontend
class PaymentService {
  // Create payment order
  static async createPaymentOrder(paymentData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      return data;
    } catch (error) {
      console.error('Create payment order error:', error);
      throw error;
    }
  }

  // Get payment history
  static async getPaymentHistory(params = {}) {
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams(params);
      
      const response = await fetch(`${API_BASE_URL}/payment/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment history');
      }

      return data;
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }

  // Get payment details by order ID
  static async getPaymentDetails(orderId) {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/payment/details/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment details');
      }

      return data;
    } catch (error) {
      console.error('Get payment details error:', error);
      throw error;
    }
  }

  // Handle payment success callback
  static async handlePaymentCallback(callbackData) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callbackData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payment callback');
      }

      return data;
    } catch (error) {
      console.error('Payment callback error:', error);
      throw error;
    }
  }

  // Open Cashfree payment page
  static openCashfreePayment(paymentData) {
    return new Promise((resolve, reject) => {
      try {
        // Check if Cashfree SDK is loaded
        if (!window.Cashfree) {
          throw new Error('Cashfree SDK not loaded');
        }

        const cashfree = new window.Cashfree({
          mode: process.env.REACT_APP_CASHFREE_MODE || 'sandbox'
        });

        const checkoutOptions = {
          paymentSessionId: paymentData.orderToken,
          redirectTarget: '_modal', // Open in modal
          onSuccess: (data) => {
            console.log('Payment Success:', data);
            resolve({
              success: true,
              orderId: data.orderId,
              paymentId: data.paymentId,
              signature: data.signature
            });
          },
          onFailure: (error) => {
            console.error('Payment Failed:', error);
            reject({
              success: false,
              error: error.message || 'Payment failed'
            });
          },
          onCancel: () => {
            console.log('Payment Cancelled');
            reject({
              success: false,
              error: 'Payment cancelled by user',
              cancelled: true
            });
          }
        };

        cashfree.checkout(checkoutOptions);

      } catch (error) {
        console.error('Cashfree payment error:', error);
        reject({
          success: false,
          error: error.message || 'Failed to initialize payment'
        });
      }
    });
  }

  // Load Cashfree SDK
  static loadCashfreeSDK() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Cashfree) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = process.env.REACT_APP_CASHFREE_MODE === 'production' 
        ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
        : 'https://sdk.cashfree.com/js/v3/cashfree.sandbox.js';
      
      script.onload = () => {
        console.log('Cashfree SDK loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        console.error('Failed to load Cashfree SDK');
        reject(new Error('Failed to load Cashfree SDK'));
      };

      document.head.appendChild(script);
    });
  }

  // Format currency
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Validate payment amount
  static validatePaymentAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid payment amount');
    }
    if (numAmount < 1) {
      throw new Error('Minimum payment amount is ₹1');
    }
    if (numAmount > 500000) {
      throw new Error('Maximum payment amount is ₹5,00,000');
    }
    return numAmount;
  }

  // Get payment status text
  static getPaymentStatusText(status) {
    const statusMap = {
      'PENDING': 'Pending',
      'SUCCESS': 'Completed',
      'FAILED': 'Failed',
      'CANCELLED': 'Cancelled',
      'REFUNDED': 'Refunded'
    };
    return statusMap[status] || status;
  }

  // Get payment status color
  static getPaymentStatusColor(status) {
    const colorMap = {
      'PENDING': '#f59e0b',
      'SUCCESS': '#10b981',
      'FAILED': '#ef4444',
      'CANCELLED': '#6b7280',
      'REFUNDED': '#8b5cf6'
    };
    return colorMap[status] || '#6b7280';
  }
}

export default PaymentService;