import React, { useState } from "react";
import "./AdminRegister.css";
import ImageUpload from "./components/ImageInput";

const AdminRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);

  const [formData, setFormData] = useState({
    role: "admin",
    fullname: "",
    profilePic: null,
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Remove the old handleFileChange function and replace with this:
  const handleImageChange = (file, error) => {
    if (error) {
      // Handle validation errors from ImageUpload component
      setErrors((prev) => ({
        ...prev,
        profilePic: error,
      }));

      // Clear the file from form data
      setFormData((prev) => ({
        ...prev,
        profilePic: null,
      }));
    } else {
      // Clear any existing errors
      setErrors((prev) => ({
        ...prev,
        profilePic: "",
      }));

      // Update form data with the new file
      setFormData((prev) => ({
        ...prev,
        profilePic: file,
      }));
    }
  };

  const validateEmail = () => {
    if (!formData.email.trim()) {
      setErrors({ email: "Email is required" });
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: "Enter a valid email address" });
      return false;
    }
    setErrors({});
    return true;
  };

  const sendVerificationEmail = async () => {
    if (!validateEmail()) return;

    setVerifyingEmail(true);
    try {
      const response = await fetch("http://localhost:3000/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Verification email sent! Please check your inbox.");
        setErrors({});
      } else {
        setErrors({
          email: data.message || "Failed to send verification email",
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setErrors({ email: "Something went wrong. Try again." });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const goToStep1 = () => {
    setCurrentStep(1);
    setEmailVerified(false);
    setVerificationCode("");
    setSentCode("");
  };

  const validateForm = () => {
    const newErrors = {};

    // Fullname validation
    if (!formData.fullname.trim()) {
      newErrors.fullname = "Full name is required";
    } else if (formData.fullname.trim().length < 2) {
      newErrors.fullname = "Full name must be at least 2 characters";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, lowercase letter, and number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const submitData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        submitData.append(key, value);
      }
    });

    const URL = "http://localhost:3000/admin/register";

    try {
      const response = await fetch(URL, {
        method: "POST",
        body: submitData,
      });
    } catch (error) {
      console.error("Registration error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Admin Registration</h2>
          <p>Create your coaching center admin account</p>

          {/* Step Indicator */}
          <div className="step-indicator">
            <div
              className={`step ${currentStep >= 1 ? "active" : ""} ${
                emailVerified ? "completed" : ""
              }`}
            >
              <span className="step-number">1</span>
              <span className="step-label">Email Verification</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
              <span className="step-number">2</span>
              <span className="step-label">Account Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Email Verification */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Step 1: Verify Your Email</h3>
            <p>Please enter your email address and verify it to continue</p>

            <div className="admin-form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <div className="email-input-container">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`admin-form-input ${errors.email ? "error" : ""}`}
                  placeholder="Enter your email address"
                  disabled={emailVerified}
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={sendVerificationEmail}
                    disabled={verifyingEmail || !formData.email}
                    className="verify-email-btn"
                  >
                    {verifyingEmail ? "Sending..." : "Send Verification Email"}
                  </button>
                )}
              </div>
              {errors.email && (
                <span className="admin-error-text">{errors.email}</span>
              )}
            </div>

            {emailVerified && (
              <div className="verification-success">
                <p>✅ Email verified successfully!</p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="continue-btn"
                >
                  Continue to Step 2
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Other Details */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="step-content">
              <div className="step-header">
                <h3>Step 2: Complete Your Profile</h3>
                <p>Fill in your account details to complete registration</p>
                <button
                  type="button"
                  onClick={goToStep1}
                  className="edit-email-btn"
                >
                  ✏️ Edit Email
                </button>
              </div>

              <div className="verified-email-display">
                <label>Verified Email</label>
                <div className="verified-email">
                  <span>{formData.email}</span>
                  <span className="verified-badge">✅ Verified</span>
                </div>
              </div>

              {/* Role Field (Hidden/Disabled) */}
              <div className="admin-form-group">
                <label htmlFor="role">Role</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  disabled
                  className="admin-form-input disabled"
                />
              </div>

              {/* Full Name */}
              <div className="admin-form-group">
                <label htmlFor="fullname">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className={`admin-form-input ${
                    errors.fullname ? "error" : ""
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullname && (
                  <span className="admin-error-text">{errors.fullname}</span>
                )}
              </div>

              {/* Profile Picture */}
              <ImageUpload
                label="Profile Picture"
                required={false}
                onChange={handleImageChange}
                error={errors.profilePic}
                accept="image/jpeg,image/jpg,image/png"
                maxSize={2 * 1024 * 1024} // 2MB
              />

              {/* Phone */}
              <div className="admin-form-group">
                <label htmlFor="phone">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`admin-form-input ${errors.phone ? "error" : ""}`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                />
                {errors.phone && (
                  <span className="admin-error-text">{errors.phone}</span>
                )}
              </div>

              {/* Password */}
              <div className="admin-form-group">
                <label htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`admin-form-input ${
                    errors.password ? "error" : ""
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <span className="admin-error-text">{errors.password}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="admin-form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`admin-form-input ${
                    errors.confirmPassword ? "error" : ""
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <span className="admin-error-text">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`admin-submit-btn ${loading ? "loading" : ""}`}
              >
                {loading ? "Registering..." : "Register Admin"}
              </button>
            </div>
          </form>
        )}

        <div className="admin-login-link">
          <p>
            Already have an account? <a href="/admin/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
};
export default AdminRegister;
