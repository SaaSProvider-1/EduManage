import React, { useState, useEffect } from "react";
import { Users, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast } from "react-toastify";
import "./Family-Info.css";

const FamilyInfo = ({
  getValues,
  sections,
  activeSection,
  setActiveSection,
  initialValues = {},
}) => {
  const [formData, setFormData] = useState({
    fatherName: initialValues.fatherName || "",
    motherName: initialValues.motherName || "",
    guardianPhone: initialValues.guardianPhone || "",
  });
  const [errors, setErrors] = useState({});
  const currentIndex = sections.indexOf(activeSection);

  // Update local state when initialValues change
  useEffect(() => {
    setFormData({
      fatherName: initialValues.fatherName || "",
      motherName: initialValues.motherName || "",
      guardianPhone: initialValues.guardianPhone || "",
    });
  }, [initialValues]);

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

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['fatherName', 'motherName', 'guardianPhone'];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field] === "") {
        newErrors[field] = true;
      }
    });
    
    // Additional validation for phone number
    if (formData.guardianPhone && formData.guardianPhone.length !== 10) {
      newErrors.guardianPhone = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
      getValues(formData);
    }
  };

  return (
    <div className="family-info-container">
      <div className="family-info-header">
        <div className="fam-icon-container">
          <Users
            className="family-icon"
            strokeWidth={2.5}
            size={48}
            color="white"
          />
        </div>
        <div className="fam-header-text">
          <h2>Family Information</h2>
          <p>Parent/guardian details</p>
        </div>
      </div>

      <form className="family-info-form">
        <div className="form-group">
          <label htmlFor="fatherName" className="form-label">
            Father's Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="fatherName"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleInputChange}
            className={`form-input ${errors.fatherName ? 'error' : ''}`}
            placeholder="Enter father's full name"
            required
          />
          {errors.fatherName && <span className="error-message">Father's name is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="motherName" className="form-label">
            Mother's Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="motherName"
            name="motherName"
            value={formData.motherName}
            onChange={handleInputChange}
            className={`form-input ${errors.motherName ? 'error' : ''}`}
            placeholder="Enter mother's full name"
            required
          />
          {errors.motherName && <span className="error-message">Mother's name is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="guardianPhone" className="form-label">
            Guardian Phone Number <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="guardianPhone"
            name="guardianPhone"
            value={formData.guardianPhone}
            onChange={handleInputChange}
            className={`form-input ${errors.guardianPhone ? 'error' : ''}`}
            placeholder="Enter guardian's phone number"
            maxLength="10"
            pattern="[0-9]{10}"
            required
          />
          {errors.guardianPhone && <span className="error-message">Valid 10-digit phone number is required</span>}
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
            (currentIndex === sections.length - 1 && formData.fatherName === "",
            formData.motherName === "",
            formData.guardianPhone === "")
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

export default FamilyInfo;
