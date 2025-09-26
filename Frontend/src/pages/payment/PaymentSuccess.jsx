import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import PaymentService from "../../services/paymentService";
import { toast } from "react-toastify";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const orderId = searchParams.get("order_id");
        const paymentId = searchParams.get("payment_id");
        const signature = searchParams.get("signature");

        if (!orderId || !paymentId) {
          throw new Error("Missing payment parameters");
        }

        // Handle payment callback
        const callbackData = {
          orderId,
          paymentId,
          signature,
          // Add other callback parameters as needed
          transactionId: searchParams.get("transaction_id"),
          gatewayPaymentId: searchParams.get("gateway_payment_id"),
          paymentMethod: searchParams.get("payment_method"),
        };

        const response = await PaymentService.handlePaymentCallback(
          callbackData
        );

        if (response.success) {
          setPaymentStatus("success");
          setPaymentDetails(response.data);
          toast.success("Payment completed successfully!");
        } else {
          throw new Error(response.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment callback error:", error);
        setPaymentStatus("failed");
        setError(error.message || "Payment processing failed");
        toast.error("Payment processing failed");
      }
    };

    handlePaymentCallback();
  }, [searchParams]);

  const handleBackToDashboard = () => {
    // Determine which dashboard to redirect to based on user role
    const userRole = localStorage.getItem("role") || "student";
    navigate(`/${userRole}/payment-history`);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (paymentStatus === "loading") {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card">
          <div className="loading-container">
            <Loader2 className="loading-spinner large" size={48} />
            <h2>Processing Payment...</h2>
            <p>Please wait while we verify your payment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="payment-result-container success">
        <div className="payment-result-card">
          <div className="result-icon success">
            <CheckCircle size={64} />
          </div>

          <h1>Payment Successful!</h1>
          <p className="result-message">
            Your payment has been processed successfully.
          </p>

          {paymentDetails && (
            <div className="payment-details-summary">
              <div className="detail-item">
                <Receipt size={16} />
                <span>Order ID: {paymentDetails.orderId}</span>
              </div>
              <div className="detail-item">
                <span>
                  Amount: {PaymentService.formatCurrency(paymentDetails.amount)}
                </span>
              </div>
              {paymentDetails.paymentDate && (
                <div className="detail-item">
                  <span>
                    Date:{" "}
                    {new Date(paymentDetails.paymentDate).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="result-actions">
            <button
              className="action-button primary"
              onClick={handleBackToDashboard}
            >
              View Payment History
            </button>
            <button
              className="action-button secondary"
              onClick={handleBackToHome}
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container error">
      <div className="payment-result-card">
        <div className="result-icon error">
          <XCircle size={64} />
        </div>

        <h1>Payment Failed</h1>
        <p className="result-message">
          {error ||
            "There was an issue processing your payment. Please try again."}
        </p>

        <div className="result-actions">
          <button
            className="action-button primary"
            onClick={() => window.history.back()}
          >
            Try Again
          </button>
          <button
            className="action-button secondary"
            onClick={handleBackToHome}
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
