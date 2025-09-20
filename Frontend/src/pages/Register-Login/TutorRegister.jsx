import {
  ArrowLeft,
  CircleCheckBig,
  GraduationCap,
  IndianRupee,
  Wallet,
  Upload,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import "./TutorRegister.css";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

// Details for selected plan.
const standardPlan = {
  name: "Standard",
  price: 2999,
  features: [
    "Up to 100 students",
    "30 teachers",
    "Fee management",
    "Mobile Web app",
  ],
};

const premiumPlan = {
  name: "Premium",
  price: 4999,
  features: [
    "Up to 500 students",
    "Up to 50 teachers",
    "Fee management",
    "Mobile Web app",
  ],
};

const plans = {
  standard: standardPlan,
  premium: premiumPlan,
};

export default function TutorRegister() {
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [planDetails, setPlanDetails] = useState(standardPlan);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Owner Information
    ownerName: "",
    email: "",
    phone: "",
    password: "",

    // Coaching Center Information
    centerName: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    yearEstablished: "",
    coachingType: "",

    // Files
    logoFile: null,

    // Payment Information
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get("plan");
    if (plan && plans[plan]) {
      setSelectedPlan(plan);
      setPlanDetails(plans[plan]);
    }
  }, [location.search]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "logoFile") {
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }

    // Clear form errors when user starts typing
    if (formError) {
      setFormError("");
    }
  };

  // Form validation function
  const validateForm = () => {
    // Required field validations
    if (!formData.ownerName.trim()) {
      setFormError("Owner/Director Name is required");
      return false;
    }
    if (!formData.centerName.trim()) {
      setFormError("Center Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setFormError("Email Address is required");
      return false;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      setFormError("Phone Number is required");
      return false;
    }
    // Phone number validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setFormError("Please enter a valid 10-digit phone number");
      return false;
    }
    if (!formData.password.trim()) {
      setFormError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters long");
      return false;
    }
    if (!formData.address.trim()) {
      setFormError("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      setFormError("City is required");
      return false;
    }
    if (!formData.state.trim()) {
      setFormError("State is required");
      return false;
    }
    if (!formData.coachingType) {
      setFormError("Type of Coaching is required");
      return false;
    }
    setFormError("");
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form submission started");
    console.log("Form data:", formData);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsLoading(true);
    setFormError("");

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (key === "logoFile" && formData[key]) {
          console.log("Adding logo file:", formData[key]);
          submitData.append("logo", formData[key]);
        } else if (formData[key] !== null && formData[key] !== "") {
          console.log(`Adding field ${key}:`, formData[key]);
          submitData.append(key, formData[key]);
        }
      });

      // Add plan type
      submitData.append("planType", selectedPlan);
      console.log("Selected plan:", selectedPlan);

      console.log(
        "Sending request to:",
        "http://localhost:3000/tenant/register"
      );

      const response = await fetch("http://localhost:3000/tenant/register", {
        method: "POST",
        body: submitData,
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        const licenseKey = data.data?.licenseKey || "Not available";
        alert(
          `Registration successful! 🎉\n\n` +
            `Your License Key: ${licenseKey}\n\n` +
            `📧 We've sent your license key to your email.\n` +
            `🔑 Students will need this key to register for your coaching center.\n` +
            `💡 Keep this key secure and share only with your students.`
        );
        // You can redirect to a success page or login page here
        // navigate('/login');
      } else {
        setFormError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setFormError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tutor-register">
      <div className="tutor-reg-container">
        <div className="tutor-reg-header">
          <span className="reg-back-grp">
            <Link to={`/`} className="reg-back-link">
              <ArrowLeft size={20} />
              Back
            </Link>
            <span className="reg-header-icon-cont">
              <GraduationCap size={40} />
            </span>
          </span>
          <h1>Join EduManage</h1>
          <p>
            Transform your coaching center with our comprehensive management
            platform
          </p>
        </div>
        <div className="tutor-reg-body">
          <div className="select-reg-plan">
            <div className="select-plan-header">
              <div className="plan-header-icon">
                <Wallet size={22} />
              </div>
              <div className="plan-header-text">
                <h2>Selected Plan</h2>
                <p>You have selected this plan</p>
              </div>
            </div>
            <div className="plan-details">
              <div className="plan-sec-1">
                <span>
                  <h2>{planDetails.name}</h2>
                  <p className="plan-price">
                    <IndianRupee size={20} />
                    {planDetails.price} / month
                  </p>
                </span>
                <span className="best-val">Best Value</span>
              </div>
              <div className="plan-sec-2 features">
                {planDetails.features.map((feature, idx) => {
                  return (
                    <p key={idx}>
                      <CircleCheckBig size={20} /> {feature}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="owner-det">
            <h3 className="verify-header">Verify Your Email First</h3>
            <div className="verify-field">
              <label htmlFor="email">
                Owner Email <span className="required">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter valid email for verification"
              />
            </div>
            <span className="verify-note">
              A verification message will be sent to this email. Please verify
              before proceeding.
            </span>
            <button className="verify-btn">Verify the Email</button>
          </div>

          {/* Coaching Center Registration Form */}
          <div className="coaching-center-form">
            <div className="plan-form-header">
              <div className="form-header-icon">
                <GraduationCap size={24} />
              </div>
              <div className="form-header-text">
                <h2>Coaching Center Details</h2>
                <p>Tell us about your coaching center</p>
              </div>
            </div>

            <form className="registration-form" onSubmit={handleSubmit}>
              {/* Logo Upload Section inside the form */}
              <div className="logo-upload-section">
                <div className="logo-upload-container">
                  <input
                    type="file"
                    id="logoFile"
                    name="logoFile"
                    accept="image/*"
                    className="file-input"
                    onChange={handleInputChange}
                  />
                  <label htmlFor="logoFile" className="file-upload-area">
                    <div className="upload-placeholder">
                      <Upload size={48} />
                      <div className="upload-text">
                        <p className="upload-primary">
                          Click to upload your profile image
                        </p>
                        <p className="upload-secondary">or drag and drop</p>
                      </div>
                      <p className="upload-info">PNG, JPG, SVG up to 5MB</p>
                      {formData.logoFile && (
                        <p className="upload-success">
                          Selected: {formData.logoFile.name}
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                <div className="logo-preview">
                  {formData.logoFile ? (
                    <img
                      src={URL.createObjectURL(formData.logoFile)}
                      alt="Logo Preview"
                    />
                  ) : (
                    <span className="no-logo">No logo uploaded yet</span>
                  )}
                </div>
              </div>

              {formError && (
                <div
                  className="error-message"
                  style={{
                    backgroundColor: "#fee",
                    color: "#c33",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                    textAlign: "center",
                  }}
                >
                  {formError}
                </div>
              )}
              <div className="plan-form-row">
                <div className="plan-form-field">
                  <label htmlFor="centerName">
                    Center Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="centerName"
                    name="centerName"
                    value={formData.centerName}
                    onChange={handleInputChange}
                    placeholder="Excellence Coaching Academy"
                    required
                  />
                </div>
                <div className="plan-form-field">
                  <label htmlFor="ownerName">
                    Owner/Director Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    placeholder="Dr. Rajesh Kumar"
                    required
                  />
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field">
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your verified email"
                    required
                  />
                </div>
                <div className="plan-form-field">
                  <label htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field full-width">
                  <label htmlFor="password">
                    Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter a secure password"
                    required
                  />
                </div>

                <div className="plan-form-field full-width">
                  <label htmlFor="password">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter a secure password"
                    required
                  />
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field full-width">
                  <label htmlFor="address">
                    Address <span className="required">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street Address"
                    rows="3"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field">
                  <label htmlFor="city">
                    City <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="plan-form-field">
                  <label htmlFor="state">
                    State <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field">
                  <label htmlFor="pinCode">PIN Code</label>
                  <input
                    type="text"
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    placeholder="PIN Code"
                  />
                </div>
                <div className="plan-form-field">
                  <label htmlFor="yearEstablished">Year Established</label>
                  <input
                    type="number"
                    id="yearEstablished"
                    name="yearEstablished"
                    value={formData.yearEstablished}
                    onChange={handleInputChange}
                    placeholder="2025"
                    min="1900"
                    max="2025"
                  />
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field full-width">
                  <label htmlFor="coachingType">
                    Type of Coaching <span className="required">*</span>
                  </label>
                  <select
                    id="coachingType"
                    name="coachingType"
                    value={formData.coachingType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select coaching type</option>
                    <option value="academic">Academic Coaching</option>
                    <option value="competitive">Competitive Exams</option>
                    <option value="professional">Professional Training</option>
                    <option value="language">Language Learning</option>
                    <option value="skill">Skill Development</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Payment Information Section inside the form */}
              <div className="payment-info-section">
                <div className="plan-form-header">
                  <div className="form-header-icon">
                    <Lock size={24} />
                  </div>
                  <div className="form-header-text">
                    <h2>Payment Information</h2>
                    <p>
                      Secure payment processing powered by industry standards
                    </p>
                  </div>
                </div>

                <div className="payment-form">
                  <div className="plan-form-row">
                    <div className="plan-form-field full-width">
                      <label htmlFor="cardholderName">
                        Cardholder Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="cardholderName"
                        name="cardholderName"
                        value={formData.cardholderName}
                        onChange={handleInputChange}
                        placeholder="Name as on card"
                      />
                    </div>
                  </div>

                  <div className="plan-form-row">
                    <div className="plan-form-field full-width">
                      <label htmlFor="cardNumber">
                        Card Number <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                  </div>

                  <div className="plan-form-row">
                    <div className="plan-form-field">
                      <label htmlFor="expiryDate">
                        Expiry Date <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="plan-form-field">
                      <label htmlFor="cvv">
                        CVV <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="payment-summary">
                    <div className="summary-row">
                      <span className="summary-label">Total Amount:</span>
                      <span className="summary-amount">
                        ₹{planDetails.price}/month
                      </span>
                    </div>
                    <p className="summary-note">
                      You can cancel anytime. No setup fees.
                    </p>
                  </div>

                  <div className="plan-form-actions">
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Processing..."
                        : "Complete Payment & Register"}
                    </button>
                    <p className="terms-text">
                      Your payment information is secure and encrypted
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
