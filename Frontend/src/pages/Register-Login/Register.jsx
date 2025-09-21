import React from "react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  Upload,
  UserRoundPen,
  UserStar,
} from "lucide-react";

import "./Register.css";

// Add CSS animation for spinner
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject the CSS if it doesn't exist
if (!document.getElementById("spinner-styles")) {
  const style = document.createElement("style");
  style.id = "spinner-styles";
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}

export default function Register() {
  // const formDataRef = useRef(null);
  const navigate = useNavigate();

  const [toggleBtn, setToggleBtn] = useState("Teacher");
  const [licenseKeyVerification, setLicenseKeyVerification] = useState({
    isVerifying: false,
    isVerified: false,
    verificationMessage: "",
    coachingCenterInfo: null,
    error: null,
  });
  const [currentStep, setCurrentStep] = useState(1); // 1: License Key, 2: Profile & Registration
  const [teacherFormData, setTeacherFormData] = useState({
    role: "teacher",
    name: "",
    phone: "",
    email: "",
    profilePicture: "",
    password: "",
    licenseKey: "", // Added license key field
    qualifications: "",
    experience: "",
    specialization: "",
  });
  const [studentFormData, setStudentFormData] = useState({
    role: "student",
    name: "",
    phone: "",
    email: "",
    profilePicture: "",
    password: "",
    confirmPassword: "",
    licenseKey: "", // Added license key field
    class: "",
    schoolName: "",
    bloodGroup: "",
    dateOfJoining: "",
    aadharNumber: "",
    aadharCardImage: "",
    lastSchoolAttended: "",
    fatherName: "",
    motherName: "",
    guardianPhone: "",
    completeAddress: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dropdownStates, setDropdownStates] = useState({
    qualification: false,
    experience: false,
    studentClass: false,
    bloodGroup: false,
  });
  const [selectedValues, setSelectedValues] = useState({
    qualification: "Select Qualification",
    experience: "Select Experience",
    studentClass: "Select class",
    bloodGroup: "Select Blood Group",
  });

  // Dropdown options
  const qualificationOptions = [
    "High School Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD/Doctorate",
    "Professional Certificate",
    "Other",
  ];

  const experienceOptions = [
    "0-1 years",
    "1-3 years",
    "3-5 years",
    "5-10 years",
    "10-15 years",
    "15+ years",
  ];

  const studentClassOptions = [
    "1st Grade",
    "2nd Grade",
    "3rd Grade",
    "4th Grade",
    "5th Grade",
    "6th Grade",
    "7th Grade",
    "8th Grade",
    "9th Grade",
    "10th Grade",
    "11th Grade",
    "12th Grade",
  ];

  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // License key verification function
  const verifyLicenseKey = async (licenseKey) => {
    if (!licenseKey || licenseKey.trim().length === 0) {
      setLicenseKeyVerification({
        isVerifying: false,
        isVerified: false,
        verificationMessage: "",
        coachingCenterInfo: null,
        error: null,
      });
      return;
    }

    // Clean and validate format first
    const cleanKey = licenseKey.replace(/-/g, "").toUpperCase();
    if (!/^[A-F0-9]{64}$/i.test(cleanKey)) {
      setLicenseKeyVerification({
        isVerifying: false,
        isVerified: false,
        verificationMessage:
          "Invalid license key format. Must be 64 characters (A-F, 0-9)",
        coachingCenterInfo: null,
        error: "Invalid format",
      });
      return;
    }

    setLicenseKeyVerification((prev) => ({
      ...prev,
      isVerifying: true,
      error: null,
    }));

    try {
      const response = await fetch(
        `http://localhost:3000/tenant/verify-license-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ licenseKey: cleanKey }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setLicenseKeyVerification({
          isVerifying: false,
          isVerified: true,
          verificationMessage: `✅ Valid license key for ${data.coachingCenter.centerName}`,
          coachingCenterInfo: data.coachingCenter,
          error: null,
        });
        setCurrentStep(2); // Move to next step
      } else {
        setLicenseKeyVerification({
          isVerifying: false,
          isVerified: false,
          verificationMessage: data.message || "Invalid license key",
          coachingCenterInfo: null,
          error: "Verification failed",
        });
      }
    } catch (error) {
      console.error("License verification error:", error);
      setLicenseKeyVerification({
        isVerifying: false,
        isVerified: false,
        verificationMessage: "Error verifying license key. Please try again.",
        coachingCenterInfo: null,
        error: "Network error",
      });
    }
  };

  // Debounced license key verification
  useEffect(() => {
    const currentFormData =
      toggleBtn === "Teacher" ? teacherFormData : studentFormData;
    const licenseKey = currentFormData.licenseKey;

    const timeoutId = setTimeout(() => {
      if (licenseKey) {
        verifyLicenseKey(licenseKey);
      } else {
        setLicenseKeyVerification({
          isVerifying: false,
          isVerified: false,
          verificationMessage: "",
          coachingCenterInfo: null,
          error: null,
        });
        setCurrentStep(1);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [
    teacherFormData.licenseKey,
    studentFormData.licenseKey,
    toggleBtn,
    teacherFormData,
    studentFormData,
  ]);

  // Toggle between Teacher and Student
  const handleSelect = (e, field) => {
    e.preventDefault(); // Prevent form submission
    setToggleBtn(field);
  };

  // Handle dropdown toggle
  const toggleDropdown = (dropdownType) => {
    // Close all other dropdowns first
    setDropdownStates((prev) => {
      const newState = {
        qualification: false,
        experience: false,
        studentClass: false,
        bloodGroup: false,
      };
      // Toggle the clicked dropdown
      newState[dropdownType] = !prev[dropdownType];
      return newState;
    });
  };

  // Handle dropdown option selection
  const handleDropdownSelect = (dropdownType, value) => {
    setSelectedValues((prev) => ({
      ...prev,
      [dropdownType]: value,
    }));

    // Update form data
    if (dropdownType === "qualification") {
      setTeacherFormData((prev) => ({ ...prev, qualifications: value }));
    } else if (dropdownType === "experience") {
      setTeacherFormData((prev) => ({ ...prev, experience: value }));
    } else if (dropdownType === "studentClass") {
      setStudentFormData((prev) => ({ ...prev, class: value }));
    } else if (dropdownType === "bloodGroup") {
      setStudentFormData((prev) => ({ ...prev, bloodGroup: value }));
    }

    // Close all dropdowns
    setDropdownStates({
      qualification: false,
      experience: false,
      studentClass: false,
      bloodGroup: false,
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".reg-custom-dropdown")) {
        setDropdownStates({
          qualification: false,
          experience: false,
          studentClass: false,
          bloodGroup: false,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // Case 1: File input
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB");
        return;
      }

      if (name === "profilePicture") {
        setPreviewImage(URL.createObjectURL(file));
      }

      if (toggleBtn === "Teacher") {
        setTeacherFormData((prev) => ({ ...prev, [name]: file }));
      } else {
        setStudentFormData((prev) => ({ ...prev, [name]: file }));
      }
    }
    // Case 2: Normal text input
    else {
      if (toggleBtn === "Teacher") {
        setTeacherFormData((prev) => ({ ...prev, [name]: value }));
      } else {
        setStudentFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const validateForm = (formData) => {
    let errors = {};

    // Common validation (applies to both roles)
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone must be a 10-digit number";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // License key validation (for both roles)
    if (!formData.licenseKey.trim()) {
      errors.licenseKey = "License key is required";
    } else {
      // Remove hyphens and validate format
      const cleanKey = formData.licenseKey.replace(/-/g, "");
      if (!/^[A-F0-9]{64}$/i.test(cleanKey)) {
        errors.licenseKey =
          "Invalid license key format. Must be 64 characters (A-F, 0-9)";
      }
    }

    // Role-based validation
    if (formData.role === "teacher") {
      if (!formData.qualifications.trim()) {
        errors.qualifications = "Qualifications are required";
      }
      if (!formData.experience.trim()) {
        errors.experience = "Experience is required";
      }
      if (!formData.specialization.trim()) {
        errors.specialization = "Specialization is required";
      }
    }

    if (formData.role === "student") {
      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = "Confirm password is required";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }

      if (!formData.class.trim()) {
        errors.class = "Class is required";
      }
      if (!formData.schoolName.trim()) {
        errors.schoolName = "School name is required";
      }
      if (!formData.lastSchoolAttended.trim()) {
        errors.lastSchoolAttended = "Last school attended is required";
      }
      if (!formData.fatherName.trim()) {
        errors.fatherName = "Father's name is required";
      }
      if (!formData.motherName.trim()) {
        errors.motherName = "Mother's name is required";
      }
      if (!formData.guardianPhone.trim()) {
        errors.guardianPhone = "Guardian mobile number is required";
      } else if (!/^\d{10}$/.test(formData.guardianPhone)) {
        errors.guardianPhone = "Guardian mobile must be 10 digits";
      }
      if (!formData.completeAddress.trim()) {
        errors.completeAddress = "Complete address is required";
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for validation errors
    const errors = validateForm(
      toggleBtn === "Teacher" ? teacherFormData : studentFormData
    );
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    } else if (
      (Object.keys(errors).length === 0 && toggleBtn === "Teacher") ||
      toggleBtn === "Student"
    ) {
      const formData = new FormData();
      if (toggleBtn === "Teacher") {
        for (const key in teacherFormData) {
          formData.append(key, teacherFormData[key]);
        }
      } else {
        for (const key in studentFormData) {
          formData.append(key, studentFormData[key]);
        }
      }

      const url =
        toggleBtn === "Teacher"
          ? "http://localhost:3000/teacher/register"
          : "http://localhost:3000/student/register";
      const loginNav = `/login?role=${toggleBtn.toLowerCase()}`;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Server response:", data);
      const { success, message } = data;
      if (success) {
        toast.success(message || "Registration successful!");
        // Redirect to login page
        navigate(loginNav);
      } else {
        toast.error(message || "Registration failed. Please try again.");
        return;
      }
      setTimeout(() => {
        console.log(teacherFormData || studentFormData);
      }, 500);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="register">
      <div className="register-container">
        <div className="register-header">
          {/* Back Button */}
          <div className="icon-back">
            <button
              type="button"
              className="reg-back-button"
              onClick={handleGoBack}
              title="Go back to home"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </button>
            <span className="register-header-icon">
              <GraduationCap strokeWidth={2.2} size={35} color="white" />
            </span>
          </div>
          <h2>EduManage</h2>
          <p>Teacher / Student Register Form</p>
        </div>
        <form className="register-body" onSubmit={handleSubmit}>
          <div className="person-toggle">
            <p>I am:</p>
            <div className="toggle-buttons">
              <button
                type="button"
                className={`teacher-toggle-btn tog-btn ${
                  toggleBtn === `Teacher` ? `select` : ``
                }`}
                onClick={(e) => handleSelect(e, "Teacher")}
              >
                <UserRoundPen strokeWidth={1.7} size={20} />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                className={`student-toggle-btn tog-btn ${
                  toggleBtn === `Student` ? `select` : ``
                }`}
                onClick={(e) => handleSelect(e, "Student")}
              >
                <UserStar strokeWidth={1.7} size={20} />
                <span>Student</span>
              </button>
            </div>
          </div>

          {/* License Key Verification Section */}
          <div
            className="license-verification-section"
            style={{
              background:
                currentStep === 1
                  ? "linear-gradient(135deg, #f0f9ff, #e0f2fe)"
                  : "#f8fffe",
              border:
                currentStep === 1 ? "2px solid #3b82f6" : "2px solid #10b981",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: licenseKeyVerification.isVerified
                    ? "#10b981"
                    : currentStep === 1
                    ? "#3b82f6"
                    : "#9ca3af",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  marginRight: "12px",
                }}
              >
                {licenseKeyVerification.isVerified ? "✓" : "1"}
              </div>
              <h3
                style={{
                  margin: 0,
                  color: licenseKeyVerification.isVerified
                    ? "#10b981"
                    : currentStep === 1
                    ? "#3b82f6"
                    : "#6b7280",
                  fontSize: "18px",
                }}
              >
                Step 1: Verify Coaching Center License Key
              </h3>
            </div>

            <div className="license-input-container">
              <label
                htmlFor="licenseKeyInput"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Enter License Key <span className="imp">*</span>
              </label>
              <input
                id="licenseKeyInput"
                name="licenseKey"
                type="text"
                placeholder="Enter your coaching center's license key (e.g., ABCD1234-EFGH5678-...)"
                value={
                  toggleBtn === "Teacher"
                    ? teacherFormData.licenseKey
                    : studentFormData.licenseKey
                }
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: licenseKeyVerification.error
                    ? "2px solid #ef4444"
                    : licenseKeyVerification.isVerified
                    ? "2px solid #10b981"
                    : "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                  transition: "border-color 0.3s ease",
                }}
                disabled={licenseKeyVerification.isVerified}
              />

              {licenseKeyVerification.isVerifying && (
                <div
                  style={{
                    marginTop: "10px",
                    color: "#3b82f6",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #3b82f6",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      marginRight: "8px",
                    }}
                  ></div>
                  Verifying license key...
                </div>
              )}

              {licenseKeyVerification.verificationMessage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: licenseKeyVerification.isVerified
                      ? "#dcfce7"
                      : "#fee2e2",
                    color: licenseKeyVerification.isVerified
                      ? "#166534"
                      : "#dc2626",
                    border: licenseKeyVerification.isVerified
                      ? "1px solid #bbf7d0"
                      : "1px solid #fecaca",
                  }}
                >
                  {licenseKeyVerification.verificationMessage}
                </div>
              )}

              {licenseKeyVerification.isVerified &&
                licenseKeyVerification.coachingCenterInfo && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                    }}
                  >
                    <h4 style={{ margin: "0 0 10px 0", color: "#166534" }}>
                      🎓 Coaching Center Information
                    </h4>
                    <div style={{ fontSize: "14px", color: "#166534" }}>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Center:</strong>{" "}
                        {licenseKeyVerification.coachingCenterInfo.centerName}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Location:</strong>{" "}
                        {licenseKeyVerification.coachingCenterInfo.city},{" "}
                        {licenseKeyVerification.coachingCenterInfo.state}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Type:</strong>{" "}
                        {licenseKeyVerification.coachingCenterInfo.coachingType}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Owner:</strong>{" "}
                        {licenseKeyVerification.coachingCenterInfo.owner}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Step 2: Profile and Registration */}
          <div
            className="basic-info"
            style={
              {
                opacity: licenseKeyVerification.isVerified ? 1 : 0.5,
                pointerEvents: licenseKeyVerification.isVerified
                  ? "auto"
                  : "none",
              }
            }
          >
            <div className="step2-header">
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: licenseKeyVerification.isVerified
                    ? "#3b82f6"
                    : "#9ca3af",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  marginRight: "12px",
                }}
              >
                2
              </div>
              <h3
                style={{
                  margin: 0,
                  color: licenseKeyVerification.isVerified
                    ? "#3b82f6"
                    : "#9ca3af",
                  fontSize: "18px",
                }}
              >
                Step 2: Complete Your Profile
              </h3>
            </div>

            <div className="basic-info-inner">
              <div className="image-container">
                <div className="upload-section">
                  <label htmlFor="profilePicture">
                    Profile Picture <span className="imp">*</span>
                  </label>
                  <div className="box-container">
                    <input
                      id="profilePicture"
                      name="profilePicture"
                      type="file"
                      className="image-input"
                      accept="image/*jpg, image/png, image/jpeg"
                      onChange={handleInputChange}
                    />
                    <div className="upload-field">
                      <Upload size={25} />
                      <p>Click to Upload Your Image</p>
                    </div>
                    <div className="image-preview-container">
                      <div className="image-preview">
                        <div className="preview-placeholder">
                          {previewImage ? (
                            <img src={previewImage} alt="Preview" />
                          ) : (
                            <p>No image selected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="name-mobile input-fields">
                <div className="name-field input-component">
                  <label htmlFor="name">
                    Full Name <span className="imp">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="eg. John Doe"
                    className="input-field name-inp"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="number-field input-component">
                  <label htmlFor="phone">
                    Mobile Number <span className="imp">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder="9876543210"
                    className="input-field phone-inp"
                    onChange={handleInputChange}
                    maxLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              <div className="email-org input-fields">
                <div className="email-field input-component">
                  <label htmlFor="email">
                    Email <span className="imp">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="johndoe@email.com"
                    className="input-field email-inp"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="password-container input-fields">
                <div className="pass-field input-component">
                  <label htmlFor="password">
                    Password <span className="imp">*</span>
                  </label>
                  <div className="password-input-container">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="input-field pass-inp"
                      placeholder="Enter your password"
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="conf-pass-field input-component">
                  <label htmlFor="confirmPassword">
                    Confirm Password <span className="imp">*</span>
                  </label>
                  <div className="password-input-container">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="input-field conf-inp"
                      placeholder="Confirm your password"
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={toggleConfirmPasswordVisibility}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher's Fields */}
            <div
              className="extra-field-container"
              style={{
                border:
                  toggleBtn === "Teacher"
                    ? "3px solid rgb(92, 132, 255)"
                    : "3px solid rgb(0, 179, 238)",
              }}
            >
              {toggleBtn === "Teacher" ? (
                <div className="teacher-field">
                  <div className="extra-header">
                    <GraduationCap size={30} />
                    <span>Teacher Information</span>
                  </div>
                  <div className="extra-info">
                    <div className="select-cont qualify">
                      <p>
                        Highest Qualification <span className="imp">*</span>
                      </p>
                      <div className="reg-custom-dropdown">
                        <div
                          className="select-field reg-dropdown-trigger"
                          onClick={() => toggleDropdown("qualification")}
                        >
                          <span>{selectedValues.qualification}</span>
                          <ChevronDown
                            size={20}
                            className={`reg-dropdown-icon ${
                              dropdownStates.qualification ? "rotated" : ""
                            }`}
                          />
                        </div>
                        {dropdownStates.qualification && (
                          <div className="reg-dropdown-options">
                            {qualificationOptions.map((option, index) => (
                              <div
                                key={index}
                                className="reg-dropdown-option"
                                onClick={() =>
                                  handleDropdownSelect("qualification", option)
                                }
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="extra-info">
                    <div className="select-cont qualify">
                      <p>
                        Years of Experience <span className="imp">*</span>
                      </p>
                      <div className="reg-custom-dropdown">
                        <div
                          className="select-field reg-dropdown-trigger"
                          onClick={() => toggleDropdown("experience")}
                        >
                          <span>{selectedValues.experience}</span>
                          <ChevronDown
                            size={20}
                            className={`reg-dropdown-icon ${
                              dropdownStates.experience ? "rotated" : ""
                            }`}
                          />
                        </div>
                        {dropdownStates.experience && (
                          <div className="reg-dropdown-options">
                            {experienceOptions.map((option, index) => (
                              <div
                                key={index}
                                className="reg-dropdown-option"
                                onClick={() =>
                                  handleDropdownSelect("experience", option)
                                }
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="extra-info">
                    <div className="select-cont qualify">
                      <label htmlFor="specialization">
                        Subject Specialization <span className="imp">*</span>
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        id="specialization"
                        className="select-field"
                        placeholder="e.g., Mathematics, Physics, Computer Science"
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="student-field">
                  <div className="extra-header">
                    <GraduationCap size={30} />
                    <span>Student Information</span>
                  </div>

                  <div className="extra-info">
                    <div className="class-school-row">
                      <div className="select-cont class-grade">
                        <p>
                          Current Class/Grade <span className="imp">*</span>
                        </p>
                        <div className="reg-custom-dropdown">
                          <div
                            className={`select-field reg-dropdown-header ${
                              dropdownStates.studentClass ? "active" : ""
                            }`}
                            onClick={() => toggleDropdown("studentClass")}
                          >
                            <span>
                              {selectedValues.studentClass || "Select class"}
                            </span>
                            <ChevronDown
                              className={`reg-dropdown-icon ${
                                dropdownStates.studentClass ? "rotate" : ""
                              }`}
                            />
                          </div>
                          {dropdownStates.studentClass && (
                            <div className="reg-dropdown-options">
                              {studentClassOptions.map((option, index) => (
                                <div
                                  key={index}
                                  className="reg-dropdown-option"
                                  onClick={() =>
                                    handleDropdownSelect("studentClass", option)
                                  }
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="extra-info">
                        <div className="select-cont blood-group">
                          <p>
                            Blood Group <span className="imp">*</span>
                          </p>
                          <div className="reg-custom-dropdown">
                            <div
                              className={`select-field reg-dropdown-header ${
                                dropdownStates.bloodGroup ? "active" : ""
                              }`}
                              onClick={() => toggleDropdown("bloodGroup")}
                            >
                              <span>
                                {selectedValues.bloodGroup ||
                                  "Select Blood Group"}
                              </span>
                              <ChevronDown
                                className={`reg-dropdown-icon ${
                                  dropdownStates.bloodGroup ? "rotate" : ""
                                }`}
                              />
                            </div>
                            {dropdownStates.bloodGroup && (
                              <div className="reg-dropdown-options">
                                {bloodGroupOptions.map((option, index) => (
                                  <div
                                    key={index}
                                    className="reg-dropdown-option"
                                    onClick={() =>
                                      handleDropdownSelect("bloodGroup", option)
                                    }
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="extra-info">
                        <div className="input-cont date-joining">
                          <label htmlFor="dateOfJoining">
                            Date of Joining <span className="imp">*</span>
                          </label>
                          <input
                            type="date"
                            name="dateOfJoining"
                            id="dateOfJoining"
                            className="input-field"
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="class-school-row">
                    <div className="input-cont current-school">
                      <label htmlFor="schoolName">
                        Current School Name <span className="imp">*</span>
                      </label>
                      <input
                        type="text"
                        name="schoolName"
                        id="schoolName"
                        className="input-field"
                        placeholder=""
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="extra-info">
                      <div className="input-cont last-school">
                        <label htmlFor="lastSchoolAttended">
                          Last School Attended
                        </label>
                        <input
                          type="text"
                          name="lastSchoolAttended"
                          id="lastSchoolAttended"
                          className="input-field"
                          placeholder=""
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="extra-info">
                    <div className="class-school-row">
                      <div className="input-cont aadhar-number">
                        <label htmlFor="aadharNumber">
                          Aadhar Card Number <span className="imp">*</span>
                        </label>
                        <input
                          type="text"
                          name="aadharNumber"
                          id="aadharNumber"
                          className="input-field"
                          placeholder="Enter 12-digit Aadhar number"
                          maxLength="12"
                          pattern="[0-9]{12}"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="input-cont aadhar-image">
                        <label htmlFor="aadharDocument">
                          Aadhar Card Image <span className="imp">*</span>
                        </label>
                        <input
                          type="file"
                          name="aadharDocument"
                          id="aadharDocument"
                          className="input-field"
                          accept="image/*"
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="extra-info">
                    <div className="guardian-row">
                      <div className="input-cont guardian-name">
                        <label htmlFor="fatherName">
                          Father's Name <span className="imp">*</span>
                        </label>
                        <input
                          type="text"
                          name="fatherName"
                          id="fatherName"
                          className="input-field"
                          placeholder=""
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="input-cont guardian-name">
                        <label htmlFor="motherName">
                          Mother's Name <span className="imp">*</span>
                        </label>
                        <input
                          type="text"
                          name="motherName"
                          id="motherName"
                          className="input-field"
                          placeholder=""
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="extra-info">
                    <div className="input-cont guardian-mobile">
                      <label htmlFor="guardianPhone">
                        Guardian's Mobile Number <span className="imp">*</span>
                      </label>
                      <input
                        type="tel"
                        name="guardianPhone"
                        id="guardianPhone"
                        className="input-field"
                        placeholder=""
                        max={10}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="extra-info">
                    <div className="input-cont complete-address">
                      <label htmlFor="completeAddress">
                        Complete Address <span className="imp">*</span>
                      </label>
                      <textarea
                        name="completeAddress"
                        id="completeAddress"
                        className="input-field address-field"
                        placeholder="Enter your complete address"
                        rows="4"
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="register-footer">
              <div className="create-container">
                <button
                  disabled={!licenseKeyVerification.isVerified}
                  style={{
                    opacity: licenseKeyVerification.isVerified ? 1 : 0.5,
                    cursor: licenseKeyVerification.isVerified
                      ? "pointer"
                      : "not-allowed",
                    background: licenseKeyVerification.isVerified
                      ? ""
                      : "#9ca3af",
                  }}
                  title={
                    !licenseKeyVerification.isVerified
                      ? "Please verify your license key first"
                      : "Create Account"
                  }
                >
                  {licenseKeyVerification.isVerified
                    ? "Create Account"
                    : "Verify License Key First"}
                </button>
              </div>
              <div className="have-acc">
                Already have account?{" "}
                <Link
                  to={`/login`}
                  className="login-link"
                  style={{ textDecoration: "none" }}
                >
                  <ArrowRight size={15} className="right-arr" />
                  Login Here
                  <ArrowLeft size={15} className="left-arr" />
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
