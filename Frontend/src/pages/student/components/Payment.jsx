import React, { useState, useEffect } from "react";
import {
  CreditCard,
  IndianRupee,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import PaymentService from "../../../services/paymentService";
import { toast } from "react-toastify";
import "./Payment.css";

const Payment = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentType: "tuition_fee",
    description: "",
    dueDate: "",
  });

  // Load payment history when component mounts
  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await PaymentService.getPaymentHistory();

      if (response.success) {
        setPaymentHistory(response.data || []);
      } else {
        toast.error("Failed to load payment history");
      }
    } catch (error) {
      console.error("Load payment history error:", error);
      toast.error("Failed to load payment history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePaymentForm = () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    if (!paymentData.paymentType) {
      toast.error("Please select payment type");
      return false;
    }
    return true;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!validatePaymentForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Create payment order
      const orderResponse = await PaymentService.createPaymentOrder({
        amount: parseFloat(paymentData.amount),
        paymentType: paymentData.paymentType,
        description: paymentData.description,
        dueDate: paymentData.dueDate,
      });

      if (orderResponse.success) {
        toast.success("Payment order created successfully!");

        // Load Cashfree SDK and open payment
        await PaymentService.loadCashfreeSDK();

        try {
          const paymentResult = await PaymentService.openCashfreePayment({
            orderToken: orderResponse.data.orderToken,
          });

          if (paymentResult.success) {
            toast.success("Payment completed successfully!");
            loadPaymentHistory(); // Reload payment history
            setShowPaymentForm(false);
            setPaymentData({
              amount: "",
              paymentType: "tuition_fee",
              description: "",
              dueDate: "",
            });
          }
        } catch (paymentError) {
          if (!paymentError.cancelled) {
            toast.error(paymentError.error || "Payment failed");
          }
        }
      } else {
        toast.error(orderResponse.message || "Failed to create payment order");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircle className="status-icon success" size={20} />;
      case "FAILED":
        return <XCircle className="status-icon failed" size={20} />;
      case "PENDING":
        return <Clock className="status-icon pending" size={20} />;
      default:
        return <Clock className="status-icon" size={20} />;
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>
          <CreditCard size={28} />
          Payment Management
        </h2>
        <button
          className="payment-btn primary"
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          disabled={isLoading}
        >
          {showPaymentForm ? "Cancel" : "Make Payment"}
        </button>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="payment-modal">
          <div className="payment-form-container">
            <h3>Make New Payment</h3>
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  value={paymentData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Type *</label>
                <select
                  name="paymentType"
                  value={paymentData.paymentType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="tuition_fee">Tuition Fee</option>
                  <option value="admission_fee">Admission Fee</option>
                  <option value="exam_fee">Exam Fee</option>
                  <option value="library_fee">Library Fee</option>
                  <option value="lab_fee">Lab Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={paymentData.description}
                  onChange={handleInputChange}
                  placeholder="Payment description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={paymentData.dueDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="payment-btn secondary"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="payment-btn primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="loading-icon" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="payment-history">
        <h3>
          <FileText size={24} />
          Payment History
        </h3>

        {isLoading ? (
          <div className="loading-container">
            <Loader2 className="loading-spinner" size={32} />
            <p>Loading payment history...</p>
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="no-payments">
            <CreditCard size={48} className="no-payments-icon" />
            <h4>No Payments Yet</h4>
            <p>
              Your payment history will appear here once you make your first
              payment.
            </p>
            <button
              className="payment-btn primary"
              onClick={() => setShowPaymentForm(true)}
            >
              Make First Payment
            </button>
          </div>
        ) : (
          <div className="payment-list">
            {paymentHistory.map((payment) => (
              <div key={payment._id} className="payment-card">
                <div className="payment-card-header">
                  <div className="payment-info">
                    <h4>Order ID: {payment.orderId}</h4>
                    <p className="payment-type">
                      {payment.paymentType?.replace("_", " ").toUpperCase()}
                    </p>
                  </div>
                  <div className="payment-amount">
                    <IndianRupee size={16} />
                    {PaymentService.formatCurrency(payment.orderAmount)}
                  </div>
                </div>

                <div className="payment-card-body">
                  <div className="payment-status">
                    {getStatusIcon(payment.paymentStatus)}
                    <span
                      className={`status-text ${payment.paymentStatus?.toLowerCase()}`}
                    >
                      {PaymentService.getPaymentStatusText(
                        payment.paymentStatus
                      )}
                    </span>
                  </div>

                  {payment.description && (
                    <p className="payment-description">{payment.description}</p>
                  )}

                  <div className="payment-dates">
                    <div>
                      <Calendar size={16} />
                      Created: {formatDate(payment.createdAt)}
                    </div>
                    {payment.paymentDate && (
                      <div>
                        <CheckCircle size={16} />
                        Paid: {formatDate(payment.paymentDate)}
                      </div>
                    )}
                    {payment.dueDate && (
                      <div>
                        <Clock size={16} />
                        Due: {formatDate(payment.dueDate)}
                      </div>
                    )}
                  </div>

                  {payment.paymentMethod && (
                    <div className="payment-method">
                      <strong>Method:</strong>{" "}
                      {PaymentService.getPaymentMethodDisplay(
                        payment.paymentMethod
                      )}
                    </div>
                  )}
                </div>

                <div className="payment-card-actions">
                  <button className="payment-btn outline small">
                    View Details
                  </button>
                  {payment.paymentStatus === "SUCCESS" && (
                    <button className="payment-btn outline small">
                      Download Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
