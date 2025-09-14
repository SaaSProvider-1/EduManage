import React, { useState, useRef, useEffect } from "react";
import { GraduationCap, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast } from "react-toastify";
import "./Academic-Info.css";

const AcademicInfo = ({
  getValues,
  sections,
  activeSection,
  setActiveSection,
  initialValues = {},
}) => {
  const [formData, setFormData] = useState({
    class: initialValues.class || "",
    schoolName: initialValues.schoolName || "",
    lastSchoolAttended: initialValues.lastSchoolAttended || "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const currentIndex = sections.indexOf(activeSection);

  const dropdownRef = useRef(null);

  // Update local state when initialValues change
  useEffect(() => {
    setFormData({
      class: initialValues.class || "",
      schoolName: initialValues.schoolName || "",
      lastSchoolAttended: initialValues.lastSchoolAttended || "",
    });
  }, [initialValues]);

  const classOptions = [
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
    { value: "4", label: "Class 4" },
    { value: "5", label: "Class 5" },
    { value: "6", label: "Class 6" },
    { value: "7", label: "Class 7" },
    { value: "8", label: "Class 8" },
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleClassSelect = (value, label) => {
    setFormData((prevState) => ({
      ...prevState,
      class: value,
    }));
    setIsDropdownOpen(false);
    
    // Clear error when user selects class
    if (errors.class) {
      setErrors(prev => ({
        ...prev,
        class: false
      }));
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

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

  const getSelectedClassLabel = () => {
    const selectedClass = classOptions.find(
      (option) => option.value === formData.class
    );
    return selectedClass ? selectedClass.label : "Select Class";
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['class', 'schoolName', 'lastSchoolAttended'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field] === "") {
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
      getValues(formData);
    }
  };

  return (
    <div className="academic-info-container">
      <div className="academic-info-header">
        <div className="aca-icon-container">
          <GraduationCap
            className="aca-graduation-icon"
            strokeWidth={2.5}
            size={48}
          />
        </div>
        <div className="aca-header-text">
          <h2>Academic Information</h2>
          <p>School and class details</p>
        </div>
      </div>

      <form className="academic-info-form">
        <div className="form-group">
          <label className="form-label">
            Class <span className="required">*</span>
          </label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <div
              className={`dropdown-header ${isDropdownOpen ? "active" : ""} ${
                formData.class ? "selected" : ""
              } ${errors.class ? 'error' : ''}`}
              onClick={toggleDropdown}
            >
              <span className="dropdown-text">{getSelectedClassLabel()}</span>
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
              {classOptions.map((option, index) => (
                <span
                  key={option.value}
                  className={`dropdown-option ${
                    formData.class === option.value ? "selected" : ""
                  }`}
                  onClick={() => handleClassSelect(option.value, option.label)}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
          {errors.class && <span className="error-message">Class selection is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="schoolName" className="form-label">
            School Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="schoolName"
            name="schoolName"
            value={formData.schoolName}
            onChange={handleInputChange}
            className={`form-input ${errors.schoolName ? 'error' : ''}`}
            placeholder="Enter your school name"
            required
          />
          {errors.schoolName && <span className="error-message">School name is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastSchoolAttended" className="form-label">
            Last School Attended <span className="required">*</span>
          </label>
          <input
            type="text"
            id="lastSchoolAttended"
            name="lastSchoolAttended"
            value={formData.lastSchoolAttended}
            onChange={handleInputChange}
            className={`form-input ${errors.lastSchoolAttended ? 'error' : ''}`}
            placeholder="Enter previous school name"
            required
          />
          {errors.lastSchoolAttended && <span className="error-message">Last school attended is required</span>}
          <p className="form-hint">Enter "N/A" if this is the first school</p>
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
            (currentIndex === sections.length - 1 && formData.class === "",
            formData.schoolName === "",
            formData.lastSchoolAttended === "")
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
};

export default AcademicInfo;
