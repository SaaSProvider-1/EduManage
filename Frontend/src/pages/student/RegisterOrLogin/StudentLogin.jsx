import React, { useState } from 'react';
import './StudentLogin.css';

const StudentLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/student-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('studentData', JSON.stringify(data.data));
        
        console.log('Login successful:', data.data);
        alert('Login successful! Welcome ' + data.data.name);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="student-login">
      {/* Header Section */}
      <div className="login-header">
        <div className="login-header-content">
          <div className="graduation-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L1 9L12 15L21 12V17H23V9L12 3Z" fill="white"/>
              <path d="M5 13.18V17.18C5 17.97 5.53 18.71 6.26 19.03L12 21.5L17.74 19.03C18.47 18.71 19 17.97 19 17.18V13.18L12 16L5 13.18Z" fill="white"/>
            </svg>
          </div>
          <h1>Student Login</h1>
          <p>Sign in to access your account</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="login-body">
        <div className="login-container">
          <div className="login-card">
            <div className="card-header">
              <div className="icon-container">
                <svg className="login-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 17L15 12L10 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="header-text">
                <h2>Welcome Back</h2>
                <p>Enter your credentials to continue</p>
              </div>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-banner">
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
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
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-content">
                      <div className="spinner"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Log In'
                  )}
                </button>
              </div>

              <div className="form-footer">
                <p className="register-link">
                  Don't have an account? 
                  <a href="/student-register" className="link">
                    Register here
                  </a>
                </p>
                <a href="/forgot-password" className="forgot-password-link">
                  Forgot your password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
