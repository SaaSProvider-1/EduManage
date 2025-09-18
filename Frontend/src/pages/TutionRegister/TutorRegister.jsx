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
    centerName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    yearEstablished: "",
    coachingType: "",
    logoFile: null,
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
    if (!formData.centerName.trim()) {
      setFormError("Center Name is required");
      return false;
    }
    if (!formData.ownerName.trim()) {
      setFormError("Owner/Director Name is required");
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

            <form
              className="registration-form"
              onSubmit={(e) => handleSubmit(e)}
            >
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
                    placeholder="admin@excellencecoaching.com"
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
                    placeholder="9876543210"
                    max="10"
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
                    placeholder="Street Address"
                    rows="3"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="plan-form-row">
                <div className="plan-form-field">
                  <label htmlFor="city">City</label>
                  <input type="text" id="city" name="city" placeholder="City" />
                </div>
                <div className="plan-form-field">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    placeholder="State"
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
                    placeholder="PIN Code"
                  />
                </div>
                <div className="plan-form-field">
                  <label htmlFor="yearEstablished">Year Established</label>
                  <input
                    type="number"
                    id="yearEstablished"
                    name="yearEstablished"
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
                  <select id="coachingType" name="coachingType" required>
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
            </form>
          </div>

          {/* Center Logo Upload Section */}
          <div className="logo-upload-form">
            <div className="plan-form-header">
              <div className="form-header-icon">
                <Upload size={20} />
              </div>
              <div className="form-header-text">
                <h2>
                  Center Logo <span className="required">*</span>
                </h2>
                <p>Upload your coaching center's logo (max 5MB)</p>
              </div>
            </div>

            <div className="logo-upload-container">
              <input
                type="file"
                id="logoFile"
                name="logoFile"
                accept="image/*"
                className="file-input"
                // required
              />
              <label htmlFor="logoFile" className="file-upload-area">
                <div className="upload-placeholder">
                  <Upload size={48} />
                  <div className="upload-text">
                    <p className="upload-primary">Click to upload</p>
                    <p className="upload-secondary">or drag and drop</p>
                  </div>
                  <p className="upload-info">PNG, JPG, SVG up to 5MB</p>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="payment-info-form">
            <div className="plan-form-header">
              <div className="form-header-icon">
                <Lock size={24} />
              </div>
              <div className="form-header-text">
                <h2>Payment Information</h2>
                <p>Secure payment processing powered by industry standards</p>
              </div>
            </div>

            <form className="payment-form">
              <div className="plan-form-row">
                <div className="plan-form-field full-width">
                  <label htmlFor="cardholderName">
                    Cardholder Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="cardholderName"
                    name="cardholderName"
                    placeholder="Name as on card"
                    // required
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
                    placeholder="1234 5678 9012 3456"
                    // required
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
                    placeholder="MM/YY"
                    // required
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
                    placeholder="123"
                    // required
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
                  onClick={(e) => handleSubmit(e)}
                >
                  Complete Payment & Register
                </button>
                <p className="terms-text">
                  Your payment information is secure and encrypted
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
