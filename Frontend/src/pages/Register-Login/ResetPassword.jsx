import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  GraduationCap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import "./ResetPassword.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Get token, email, and role from URL params
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const role = searchParams.get("role");

  useEffect(() => {
    // Validate required parameters
    if (!token || !email || !role) {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [token, email, role, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$&!%*?])[A-Za-z\d@$&!%*?]{8,}$/;

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }

    if (!regex.test(password)) {
      return "Password must include uppercase, lowercase, number, and special character";
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate new password
    const passwordError = validatePassword(formData.newPassword);
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
        role === "student"
          ? "http://localhost:3000/student/reset-password"
          : "http://localhost:3000/teacher/reset-password";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (data.success) {
        setIsSuccess(true);
        toast.success(data.message || "Password reset successfully!");
      } else {
        toast.error(
          data.message || "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate(`/login?role=${role}`);
  };

  if (isSuccess) {
    return (
      <div className="edu-reset-container">
        <div className="edu-reset-card">
          <div className="edu-reset-header">
            <div className="edu-reset-icon success">
              <CheckCircle size={32} />
            </div>
            <h1>Password Reset Successful!</h1>
            <p>Your password has been successfully updated</p>
          </div>

          <div className="success-content">
            <div className="success-message">
              <h3>🎉 All Done!</h3>
              <p>
                You can now sign in to your account using your new password.
              </p>
            </div>

            <button
              onClick={handleLoginRedirect}
              className={`login-redirect-btn ${role}`}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edu-reset-container">
      <div className="edu-reset-card">
        {/* Header Section */}
        <div className="edu-reset-header">
          <div className="edu-reset-icon">
            <GraduationCap size={32} />
          </div>
          <h1>Reset Your Password</h1>
          <p>Enter your new password below</p>
        </div>

        {/* Account Info */}
        <div className="account-info">
          <div className="account-detail">
            <span className="label">Account:</span>
            <span className="value">{email}</span>
          </div>
          <div className="account-detail">
            <span className="label">Role:</span>
            <span className={`role-badge ${role}`}>
              {role === "student" ? "Student" : "Teacher"}
            </span>
          </div>
        </div>

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="edu-reset-form">
          <div className="reset-form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="reset-input-container">
              <Lock className="reset-input-icon" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={errors.newPassword ? "error" : ""}
                placeholder="Enter your new password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("password")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="reset-error-message">{errors.newPassword}</span>
            )}
          </div>

          <div className="reset-form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="reset-input-container">
              <Lock className="reset-input-icon" size={16} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? "error" : ""}
                placeholder="Confirm your new password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="reset-error-message">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Password Requirements */}
          <div className="password-requirements">
            <div className="requirement-header">
              <AlertCircle size={16} />
              <span>Password Requirements:</span>
            </div>
            <ul>
              <li className={formData.newPassword.length >= 8 ? "valid" : ""}>
                At least 8 characters long
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? "valid" : ""}>
                One lowercase letter
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? "valid" : ""}>
                One uppercase letter
              </li>
              <li className={/\d/.test(formData.newPassword) ? "valid" : ""}>
                One number
              </li>
              <li
                className={
                  /[@$&!%*?]/.test(formData.newPassword) ? "valid" : ""
                }
              >
                One special character (@$&!%*?)
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className={`reset-btn ${role}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="edu-reset-footer">
          <p>
            Remember your password?{" "}
            <button
              type="button"
              onClick={handleLoginRedirect}
              className="login-link"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
