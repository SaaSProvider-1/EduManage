import React, { useState } from "react";
import { FileCheck, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import "./Document-Info.css";

const DocumentsAddress = ({ 
  getValues,
  sections,
  activeSection,
  setActiveSection,
 }) => {
  const [formData, setFormData] = useState({
    aadharNumber: "",
    aadharDocument: null,
    completeAddress: "",
  });

  const [errors, setErrors] = useState({});
  const currentIndex = sections.indexOf(activeSection);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          aadharDocument: "Please upload PDF, JPG, or PNG file only",
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          aadharDocument: "File size must be less than 5MB",
        }));
        return;
      }

      setFormData((prevState) => ({
        ...prevState,
        aadharDocument: file,
      }));

      setErrors((prev) => ({
        ...prev,
        aadharDocument: "",
      }));
    }
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
    <div className="documents-address-container">
      <div className="documents-address-header">
        <div className="icon-container">
          <FileCheck className="documents-icon" size={32} />
        </div>
        <div className="header-text">
          <h2>Documents & Address</h2>
          <p>Required documents and address</p>
        </div>
      </div>

      <form className="documents-address-form">
        <div className="form-group">
          <label htmlFor="aadharNumber" className="form-label">
            <span className="aadhar-highlight">Aadhar Number</span>{" "}
            <span className="required">*</span>
          </label>
          <input
            type="text"
            id="aadharNumber"
            name="aadharNumber"
            value={formData.aadharNumber}
            onChange={handleInputChange}
            className={`form-input ${errors.aadharNumber ? "error" : ""}`}
            placeholder="Enter 12-digit Aadhar number"
            maxLength="12"
            pattern="[0-9]{12}"
            required
          />
          {errors.aadharNumber ? (
            <span className="error-message">{errors.aadharNumber}</span>
          ) : (
            <span className="form-hint">Aadhar number must be 12 digits</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="aadharDocument" className="form-label">
            Aadhar Proof Document
          </label>
          <div className="file-input-container">
            <input
              type="file"
              id="aadharDocument"
              name="aadharDocument"
              onChange={handleFileChange}
              className="file-input"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label htmlFor="aadharDocument" className="file-input-label">
              <span className="file-input-text">
                {formData.aadharDocument
                  ? formData.aadharDocument.name
                  : "Choose File"}
              </span>
              <span className="file-input-button">
                {formData.aadharDocument ? "Change File" : "No file chosen"}
              </span>
            </label>
          </div>
          {errors.aadharDocument ? (
            <span className="error-message">{errors.aadharDocument}</span>
          ) : (
            <span className="form-hint">
              Upload Aadhar card copy (PDF, JPG, or PNG)
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="completeAddress" className="form-label">
            <span className="address-highlight">Complete Address</span>{" "}
            <span className="required">*</span>
          </label>
          <textarea
            id="completeAddress"
            name="completeAddress"
            value={formData.completeAddress}
            onChange={handleInputChange}
            className={`form-textarea ${errors.completeAddress ? "error" : ""}`}
            placeholder="Enter complete residential address with pincode"
            rows="4"
            required
          />
          {errors.completeAddress ? (
            <span className="error-message">{errors.completeAddress}</span>
          ) : (
            <span className="form-hint">Please provide complete address</span>
          )}
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
          disabled={( currentIndex === sections.length - 1 && formData.aadharNumber === "",
            formData.aadharDocument === null,
            formData.completeAddress === "")}
        >
          <span className="next-icon">
            <ArrowBigRight />
          </span>
          <p>Submit</p>
        </button>
      </div>
    </div>
  );
};

export default DocumentsAddress;
