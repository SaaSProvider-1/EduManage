import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  GraduationCap,
  Upload,
  UserRoundPen,
  UserStar,
} from "lucide-react";

import "./Register.css";

export default function Register() {
  const formDataRef = useRef(null);
  const navigate = useNavigate();

  const [toggleBtn, setToggleBtn] = useState("Teacher");
  const [teacherFormData, setTeacherFormData] = useState({
    role: "teacher",
    name: "",
    phone: "",
    email: "",
    profilePicture: "",
    password: "",
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
      const { success, message, user } = data;
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

  return (
    <div className="register">
      <div className="register-container">
        <div className="register-header">
          <span className="register-header-icon">
            <GraduationCap strokeWidth={2.2} size={40} color="white" />
          </span>
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

          <div className="basic-info">
            <div className="image-container">
              <div className="upload-section">
                <label htmlFor="profilePicture">
                  Profile Picture <span className="imp">*</span>
                </label>
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
            <div className="name-mobile input-fields">
              <div className="name-field input-component">
                <label htmlFor="name">
                  Full Name <span className="imp">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
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
                  className="input-field email-inp"
                  onChange={handleInputChange}
                />
              </div>
              <div className="org-field input-component">
                <label htmlFor="organization">
                  Organization/Institution <span className="imp">*</span>
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  className="input-field org-inp"
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="password-container input-fields">
              <div className="pass-field input-component">
                <label htmlFor="password">
                  Password <span className="imp">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="text"
                  className="input-field pass-inp"
                  onChange={handleInputChange}
                />
              </div>
              <div className="conf-pass-field input-component">
                <label htmlFor="confirmPassword">
                  Confirm Password <span className="imp">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="text"
                  className="input-field conf-inp"
                  onChange={handleInputChange}
                />
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
                      <label htmlFor="lastSchoolAttended">Last School Attended</label>
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
              <button>Create Account</button>
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
        </form>
      </div>
    </div>
  );
}
