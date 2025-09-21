import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  Lock,
  User,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import "./Login.css";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const role = params.get("role");
    if (role === "teacher" || role === "student") {
      setUserType(role);
    }
  }, [location.search]);

  useEffect(() => {
    if (location.state?.showToast) {
      toast.error(location.state.showToast);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for validation errors
    const isValid = validateForm();
    if (!isValid) {
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    }

    try {
      const url =
        userType === "student"
          ? "http://localhost:3000/student/login"
          : "http://localhost:3000/teacher/login";

      // Send request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Server response:", data);

      const { success, message, token, user } = data;

      if (success) {
        // Local Storage
        localStorage.setItem("Token", token);
        localStorage.setItem("User", JSON.stringify(user));
        localStorage.setItem("UserType", userType);

        // Toast Success Message
        toast.success(message || "Login successful!");

        // Redirect based on user type
        if (userType === "student") {
          navigate(`/student/profile?id=${user.id}`);
        } else if (userType === "teacher") {
          navigate(`/teacher/dashboard?id=${user.id}`);
        }
      } else {
        toast.error(message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="edu-login-container">
      <div className="edu-login-card">
        {/* Header Section */}
        <div className="edu-login-header">
          {/* Back Button */}
          <div className="back-button-container">
            <button
              type="button"
              className="reg-back-button"
              onClick={handleGoBack}
              title="Go back to home"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </button>
            <div className="edu-login-icon">
              <GraduationCap size={32} />
            </div>
          </div>
          <h1>EduPortal</h1>
          <p>Sign in to your account</p>
        </div>

        {/* User Type Selection */}
        <div className="user-type-selection">
          <button
            type="button"
            className={`log-user-type-btn ${
              userType === "student" ? "active student" : ""
            }`}
            onClick={() => handleUserTypeChange("student")}
          >
            <User size={16} />
            Student
          </button>
          <button
            type="button"
            className={`log-user-type-btn ${
              userType === "teacher" ? "active teacher" : ""
            }`}
            onClick={() => handleUserTypeChange("teacher")}
          >
            <UserCheck size={16} />
            Teacher
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="edu-login-form">
          <div className="log-form-group">
            <label htmlFor="email">Email Address</label>
            <div className="log-input-container">
              <Mail className="log-input-icon" size={16} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "error" : ""}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <span className="log-error-message">{errors.email}</span>
            )}
          </div>

          <div className="log-form-group">
            <label htmlFor="password">Password</label>
            <div className="log-input-container">
              <Lock className="log-input-icon" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? "error" : ""}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="log-error-message">{errors.password}</span>
            )}
          </div>

          <button type="submit" className={`login-btn ${userType}`}>
            Sign in as {userType === "student" ? "Student" : "Teacher"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="edu-login-footer">
          <Link to="/forgot-password" className="forgot-link">
            Forgot your password?
          </Link>
          <p>
            Don't have an account?{" "}
            <Link to="/register">Register as Student / Teacher</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
