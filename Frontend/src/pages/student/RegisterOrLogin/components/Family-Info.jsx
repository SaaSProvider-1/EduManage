import React, { useState } from "react";
import { Users, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import "./Family-Info.css";

const FamilyInfo = ({
  getValues,
  sections,
  activeSection,
  setActiveSection,
}) => {
  const [formData, setFormData] = useState({
    fatherName: "",
    motherName: "",
    guardianPhone: "",
  });
  const currentIndex = sections.indexOf(activeSection);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
    getValues(formData);
  };

  return (
    <div className="family-info-container">
      <div className="family-info-header">
        <div className="icon-container">
          <Users
            className="family-icon"
            strokeWidth={2.5}
            size={48}
            color="white"
          />
        </div>
        <div className="header-text">
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
            className="form-input"
            placeholder="Enter father's full name"
            required
          />
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
            className="form-input"
            placeholder="Enter mother's full name"
            required
          />
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
            className="form-input"
            placeholder="Enter guardian's phone number"
            maxLength="10"
            pattern="[0-9]{10}"
            required
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
