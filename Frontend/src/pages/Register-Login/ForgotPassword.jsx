import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  GraduationCap,
  User,
  UserCheck,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [userType, setUserType] = useState("student");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    setEmail(e.target.value);

    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setIsEmailSent(false); // Reset email sent status when switching user types
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    }

    setIsLoading(true);

    try {
      const url =
        userType === "student"
          ? "http://localhost:3000/student/forgot-password"
          : "http://localhost:3000/teacher/forgot-password";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (data.success) {
        setIsEmailSent(true);
        toast.success(
          data.message || "Password reset link sent to your email!"
        );
      } else {
        toast.error(
          data.message || "Failed to send reset link. Please try again."
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    handleSubmit(new Event("submit"));
  };

  if (isEmailSent) {
    return (
      <div className="edu-forgot-container">
        <div className="edu-forgot-card">
          <div className="edu-forgot-header">
            <div className="edu-forgot-icon success">
              <Send size={32} />
            </div>
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to your email address</p>
          </div>

          <div className="email-sent-content">
            <div className="sent-email-display">
              <Mail size={20} />
              <span>{email}</span>
            </div>

            <div className="email-instructions">
              <h3>What's next?</h3>
              <ul>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the "Reset Password" link in the email</li>
                <li>Create your new password</li>
                <li>Sign in with your new password</li>
              </ul>
            </div>

            <div className="email-actions">
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendEmail}
              >
                Resend Email
              </button>

              <Link to="/login" className="back-to-login">
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edu-forgot-container">
      <div className="edu-forgot-card">
        {/* Header Section */}
        <div className="edu-forgot-header">
          <div className="edu-forgot-icon">
            <GraduationCap size={32} />
          </div>
          <h1>Forgot Password</h1>
          <p>
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {/* User Type Selection */}
        <div className="user-type-selection">
          <button
            type="button"
            className={`forgot-user-type-btn ${
              userType === "student" ? "active student" : ""
            }`}
            onClick={() => handleUserTypeChange("student")}
          >
            <User size={16} />
            Student
          </button>
          <button
            type="button"
            className={`forgot-user-type-btn ${
              userType === "teacher" ? "active teacher" : ""
            }`}
            onClick={() => handleUserTypeChange("teacher")}
          >
            <UserCheck size={16} />
            Teacher
          </button>
        </div>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit} className="edu-forgot-form">
          <div className="forgot-form-group">
            <label htmlFor="email">Email Address</label>
            <div className="forgot-input-container">
              <Mail className="forgot-input-icon" size={16} />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className={errors.email ? "error" : ""}
                placeholder="Enter your registered email"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span className="forgot-error-message">{errors.email}</span>
            )}
          </div>

          <button
            type="submit"
            className={`forgot-btn ${userType}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Sending...
              </>
            ) : (
              <>Send Reset Link</>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="edu-forgot-footer">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
          <p>
            Remember your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
