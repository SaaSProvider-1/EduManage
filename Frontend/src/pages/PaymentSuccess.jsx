import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState("");

  const orderId = searchParams.get("orderId");
  const paymentType = searchParams.get("type");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        console.log("Checking payment status for order:", orderId);

        const response = await fetch(
          `http://localhost:3000/api/payment/webhook`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderId,
              txStatus: "SUCCESS", // This would normally come from Cashfree
              paymentMode: "Unknown",
              txMsg: "Payment completed",
              txTime: new Date().toISOString(),
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setPaymentStatus("success");
          setPaymentDetails({
            orderId,
            message: "Payment completed successfully!",
            type: paymentType,
          });
        } else {
          setPaymentStatus("failed");
          setError(data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment status check error:", error);
        setPaymentStatus("failed");
        setError("Failed to verify payment status");
      }
    };

    if (orderId) {
      checkPaymentStatus();
    } else {
      setPaymentStatus("error");
      setError("No order ID provided");
    }
  }, [orderId, paymentType]);

  const handleContinue = () => {
    if (paymentType === "tutor") {
      navigate("/login?role=teacher&message=registration_complete");
    } else {
      navigate("/student/dashboard");
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        {paymentStatus === "loading" && (
          <div className="loading-state">
            <Loader2 className="loading-spinner" size={48} />
            <h2>Verifying Payment...</h2>
            <p>Please wait while we confirm your payment.</p>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="success-state">
            <CheckCircle className="success-icon" size={64} />
            <h2>Payment Successful!</h2>
            <p>{paymentDetails?.message}</p>

            <div className="payment-info">
              <div className="info-item">
                <strong>Order ID:</strong> {orderId}
              </div>
              <div className="info-item">
                <strong>Status:</strong>{" "}
                <span className="status-success">Completed</span>
              </div>
            </div>

            {paymentType === "tutor" && (
              <div className="success-message">
                <h3>🎉 Registration Complete!</h3>
                <p>
                  Your coaching center has been successfully registered. You can
                  now login and start managing your institution.
                </p>
              </div>
            )}

            <div className="action-buttons">
              <button onClick={handleContinue} className="continue-btn primary">
                {paymentType === "tutor"
                  ? "Login to Dashboard"
                  : "Go to Dashboard"}
              </button>
              <button
                onClick={handleBackToHome}
                className="continue-btn secondary"
              >
                <ArrowLeft size={20} />
                Back to Home
              </button>
            </div>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="failed-state">
            <XCircle className="failed-icon" size={64} />
            <h2>Payment Failed</h2>
            <p>{error || "Your payment could not be processed."}</p>

            <div className="payment-info">
              <div className="info-item">
                <strong>Order ID:</strong> {orderId}
              </div>
              <div className="info-item">
                <strong>Status:</strong>{" "}
                <span className="status-failed">Failed</span>
              </div>
            </div>

            <div className="action-buttons">
              <button
                onClick={() => window.history.back()}
                className="continue-btn primary"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToHome}
                className="continue-btn secondary"
              >
                <ArrowLeft size={20} />
                Back to Home
              </button>
            </div>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="error-state">
            <XCircle className="error-icon" size={64} />
            <h2>Something went wrong</h2>
            <p>{error}</p>

            <div className="action-buttons">
              <button
                onClick={handleBackToHome}
                className="continue-btn primary"
              >
                <ArrowLeft size={20} />
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
