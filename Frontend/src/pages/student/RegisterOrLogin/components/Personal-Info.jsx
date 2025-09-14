import { useEffect, useState, useRef } from "react";
import { User, ArrowBigLeft, ArrowBigRight } from "lucide-react";

import "./Personal-Info.css";
import { toast } from "react-toastify";

export default function PersonalInfo({
  getValues,
  sections,
  activeSection,
  setActiveSection,
  initialValues = {},
}) {
  const [isMobile] = useState(window.innerWidth < 768);
  const [formValues, setFormValues] = useState({
    name: initialValues.name || "",
    email: initialValues.email || "",
    studentPhone: initialValues.studentPhone || "",
    dateOfJoining: initialValues.dateOfJoining || "",
    photo: initialValues.photo || "",
    bloodGroup: initialValues.bloodGroup || "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const currentIndex = sections.indexOf(activeSection);

  const dropdownRef = useRef(null);

  const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];

  const handleChages = (e) => {
    const { name, value, files } = e.target;
    setFormValues((prevVals) => ({
      ...prevVals,
      [name]: files ? files[0] : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleBloodGroupSelect = (value, label) => {
    setFormValues((prevState) => ({
      ...prevState,
      bloodGroup: value,
    }));
    setIsDropdownOpen(false);
    
    // Clear error when user selects blood group
    if (errors.bloodGroup) {
      setErrors(prev => ({
        ...prev,
        bloodGroup: false
      }));
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getSelectedBloodGroupLabel = () => {
    const selectedBloodGroup = bloodGroupOptions.find(
      (option) => option.value === formValues.bloodGroup
    );
    return selectedBloodGroup ? selectedBloodGroup.label : "Select Blood Group";
  };

  // Update local state when initialValues change
  useEffect(() => {
    setFormValues({
      name: initialValues.name || "",
      email: initialValues.email || "",
      studentPhone: initialValues.studentPhone || "",
      dateOfJoining: initialValues.dateOfJoining || "",
      photo: initialValues.photo || "",
      bloodGroup: initialValues.bloodGroup || "",
    });
  }, [initialValues]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['name', 'email', 'dateOfJoining', 'bloodGroup'];
    
    requiredFields.forEach(field => {
      if (!formValues[field] || formValues[field] === "") {
        newErrors[field] = true;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
      getValues(formValues);
    }
  };

  return (
    <div className="personal-info">
      <div className="personal-header">
        <div className="pers-icon-container">
          <User className="user-icon" strokeWidth={2.5} size={25} />
        </div>
        <div className="header-desc">
          <h2>Personal Information</h2>
          <p className="personal-hader-desc">Basic student details and photo</p>
        </div>
      </div>
      <form className="personal-form">
        <div className="pers-inp-1 form">
          <label htmlFor="name">Student Name *</label>
          <input
            name="name"
            id="name"
            type="text"
            value={formValues.name}
            placeholder="Enter student's full name"
            className={`pers-name ${errors.name ? 'error' : ''}`}
            onChange={(e) => handleChages(e)}
            required
          />
          {errors.name && <span className="error-message">Student name is required</span>}
        </div>

        <div className="pers-inp-1 form">
          <label htmlFor="email">Student Email *</label>
          <input
            name="email"
            id="email"
            type="email"
            value={formValues.email}
            placeholder="Enter student's Email address"
            className={`pers-name ${errors.email ? 'error' : ''}`}
            onChange={(e) => handleChages(e)}
            required
          />
          {errors.email && <span className="error-message">Student email is required</span>}
        </div>
        <div className="pers-inp-1 form">
          <label htmlFor="guardianPhone" className="form-label">
            Student Phone Number {"(optional)"}
          </label>
          <input
            type="tel"
            id="studentPhone"
            name="studentPhone"
            value={formValues.studentPhone}
            onChange={handleChages}
            className="pers-name"
            placeholder="Enter student phone number"
            maxLength="10"
            pattern="[0-9]{10}"
          />
        </div>
        <div className="pers-inp-2 form">
          <label htmlFor="date">Date of joining *</label>
          <input
            name="dateOfJoining"
            id="date"
            type="date"
            value={formValues.dateOfJoining}
            placeholder="Enter student's full name"
            className={`pers-name ${errors.dateOfJoining ? 'error' : ''}`}
            onChange={(e) => handleChages(e)}
            required
          />
          {errors.dateOfJoining && <span className="error-message">Date of joining is required</span>}
        </div>
        <div className="pers-inp-1 form">
          <label className="form-label">
            Blood Group <span className="required">*</span>
          </label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <div
              className={`dropdown-header ${isDropdownOpen ? "active" : ""} ${
                formValues.bloodGroup ? "selected" : ""
              } ${errors.bloodGroup ? 'error' : ''}`}
              onClick={toggleDropdown}
            >
              <span className="dropdown-text">
                {getSelectedBloodGroupLabel()}
              </span>
              <svg
                className={`dropdown-arrow ${isDropdownOpen ? "rotated" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={`dropdown-options ${isDropdownOpen ? "open" : ""}`}>
              {bloodGroupOptions.map((option, index) => (
                <span
                  key={option.value}
                  className={`dropdown-option ${
                    formValues.bloodGroup === option.value ? "selected" : ""
                  }`}
                  onClick={() =>
                    handleBloodGroupSelect(option.value, option.label)
                  }
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
          {errors.bloodGroup && <span className="error-message">Blood group is required</span>}
        </div>
        <div className="pers-inp-3 form">
          <label htmlFor="file">Student photo</label>
          <input
            name="photo"
            id="file"
            type="file"
            placeholder="Enter student's full name"
            className="pers-name"
            onChange={(e) => handleChages(e)}
          />
        </div>
      </form>

      <div className="personal-footer">
        <button
          className="prev-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <span className="prev-icon">
            <ArrowBigLeft />
          </span>
          <p>Previous</p>
        </button>
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={
            (currentIndex === sections.length - 1 && formValues.name === "",
            formValues.dateOfJoining === "",
            formValues.photo === "",
            formValues.bloodGroup === "")
          }
        >
          <span className="next-icon">
            <ArrowBigRight />
          </span>
          <p>Next</p>
        </button>
      </div>
    </div>
  );
}
