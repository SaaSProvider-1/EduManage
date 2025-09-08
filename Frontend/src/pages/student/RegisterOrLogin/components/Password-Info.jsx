import React, { useState } from 'react';
import './Password-Info.css';

const PasswordInfo = ({
  getValues,
  sections,
  activeSection,
  setActiveSection,
}) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const currentIndex = sections.indexOf(activeSection);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate password
    if (!passwordValidation.isValid) {
      newErrors.password = 'Password must meet all requirements';
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Pass the form data back to parent
    getValues({
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });

    console.log('Registration completed!', formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  return (
    <div className="password-info-container">
      <div className="password-info-header">
        <div className="icon-container">
          <svg className="password-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8H20C21.1 8 22 8.9 22 10V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H6V6C6 3.8 7.8 2 10 2H14C16.2 2 18 3.8 18 6V8Z" fill="white"/>
            <path d="M6 8H18V6C18 4.9 17.1 4 16 4H8C6.9 4 6 4.9 6 6V8Z" fill="white"/>
            <circle cx="12" cy="15" r="2" fill="#4285f4"/>
          </svg>
        </div>
        <div className="header-text">
          <h2>Password Information</h2>
          <p>Create secure password for your account</p>
        </div>
      </div>

      <form className="password-info-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Create Password <span className="required">*</span>
          </label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12S7 5 12 5S22 12 22 12S17 19 12 19S2 12 2 12Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12S7 5 12 5S22 12 22 12S17 19 12 19S2 12 2 12Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
          
          {/* Password Requirements */}
          <div className="password-requirements">
            <p className="requirements-title">Password must contain:</p>
            <div className="requirements-list">
              <div className={`requirement ${passwordValidation.minLength ? 'valid' : ''}`}>
                <span className="requirement-icon">
                  {passwordValidation.minLength ? '✓' : '×'}
                </span>
                At least 8 characters
              </div>
              <div className={`requirement ${passwordValidation.hasUpperCase ? 'valid' : ''}`}>
                <span className="requirement-icon">
                  {passwordValidation.hasUpperCase ? '✓' : '×'}
                </span>
                One uppercase letter
              </div>
              <div className={`requirement ${passwordValidation.hasLowerCase ? 'valid' : ''}`}>
                <span className="requirement-icon">
                  {passwordValidation.hasLowerCase ? '✓' : '×'}
                </span>
                One lowercase letter
              </div>
              <div className={`requirement ${passwordValidation.hasNumbers ? 'valid' : ''}`}>
                <span className="requirement-icon">
                  {passwordValidation.hasNumbers ? '✓' : '×'}
                </span>
                One number
              </div>
              <div className={`requirement ${passwordValidation.hasSpecialChar ? 'valid' : ''}`}>
                <span className="requirement-icon">
                  {passwordValidation.hasSpecialChar ? '✓' : '×'}
                </span>
                One special character
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password <span className="required">*</span>
          </label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12S7 5 12 5S22 12 22 12S17 19 12 19S2 12 2 12Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12S7 5 12 5S22 12 22 12S17 19 12 19S2 12 2 12Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <span className="success-message">Passwords match!</span>
          )}
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            className="btn-previous"
            onClick={handlePrevious}
          >
            Previous
          </button>
          <button 
            type="submit" 
            className="btn-next"
            disabled={!passwordValidation.isValid || formData.password !== formData.confirmPassword}
          >
            Complete Registration
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordInfo;