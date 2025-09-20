import React, { useState, useRef } from "react";
import "./ImageInput.css";

const ImageUpload = ({
  label = "Profile Picture",
  required = false,
  onChange,
  error,
  accept = "image/jpeg,image/jpg,image/png",
  maxSize = 2 * 1024 * 1024, // 2MB
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return "Please select a file";

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG, and PNG files are allowed";
    }

    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFile = (file) => {
    const validationError = validateFile(file);

    if (validationError) {
      if (onChange) {
        onChange(null, validationError);
      }
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setFileName(file.name);

    if (onChange) {
      onChange(file, null);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreview(null);
    setFileName("");
    fileInputRef.current.value = "";
    if (onChange) {
      onChange(null, null);
    }
  };

  return (
    <div className="image-upload-container">
      {/* Label */}
      <label className="upload-label">
        {label} {required && <span className="required-asterisk">*</span>}
      </label>

      <div className="upload-content">
        {/* Upload Area */}
        <div
          className={`upload-area ${dragActive ? "drag-active" : ""} ${
            error ? "error" : ""
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="upload-content-inner">
            <div className="upload-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="upload-text">
              <p className="upload-main-text">Click to Upload Your Image</p>
              <p className="upload-sub-text">or drag and drop</p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="file-input-hidden"
          />
        </div>

        {/* Preview Area */}
        <div className="preview-area">
          {preview ? (
            <div className="preview-container">
              <div className="preview-image-wrapper">
                <img src={preview} alt="Preview" className="preview-image" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="remove-image-btn"
                  aria-label="Remove image"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="file-name">{fileName}</p>
            </div>
          ) : (
            <div className="no-image-container">
              <div className="no-image-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <p className="no-image-text">No image selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default ImageUpload;
