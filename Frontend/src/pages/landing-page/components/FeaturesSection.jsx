import React from 'react';
import './FeaturesSection.css';

const FeaturesSection = () => {
  return (
    <section className="features-section section section-white">
      <div className="container">
        <div className="section-header text-center animate-on-scroll">
          <h2 className="heading-lg">
            Powerful Features for <span className="text-primary">Modern Education</span>
          </h2>
          <p className="text-lg">
            Comprehensive dashboards designed for administrators and teachers with everything you need to manage your educational institution effectively.
          </p>
        </div>

        <div className="features-grid grid grid-2">
          {/* Admin Panel Features */}
          <div className="feature-panel card animate-on-scroll">
            <div className="panel-header">
              <div className="panel-icon admin-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="panel-info">
                <h3 className="heading-sm">Admin Panel</h3>
                <p className="panel-description">Complete control and oversight of your institution</p>
              </div>
            </div>
            <div className="panel-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.7032C21.7033 16.0523 20.9976 15.5987 20.208 15.4135" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13C16.7904 3.31548 17.4961 3.76907 18.0022 4.41993C18.5083 5.07079 18.7928 5.88121 18.7928 6.71658C18.7928 7.55195 18.5083 8.36237 18.0022 9.01323C17.4961 9.66409 16.7904 10.1177 16 10.303" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Total Teachers/Students/Batches</h4>
                  <p>Real-time overview of all institutional metrics</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Attendance Summary</h4>
                  <p>Track attendance patterns and generate reports</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                    <path d="M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Fee Management</h4>
                  <p>Complete fee collection and payment tracking</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Quick Alerts</h4>
                  <p>Instant notifications for important events</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 12L11 8L15 12L21 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Reports & Analytics</h4>
                  <p>Comprehensive insights and data visualization</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="9,11 12,14 22,4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Approvals & Settings</h4>
                  <p>Workflow management and system configuration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Panel Features */}
          <div className="feature-panel card animate-on-scroll">
            <div className="panel-header">
              <div className="panel-icon teacher-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 10V6C22 5.46957 21.7893 4.96086 21.4142 4.58579C21.0391 4.21071 20.5304 4 20 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H12" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 8H22" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 22L20 20" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="panel-info">
                <h3 className="heading-sm">Teacher Panel</h3>
                <p className="panel-description">Streamlined tools for effective teaching management</p>
              </div>
            </div>
            <div className="panel-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.7 6.3C15.1 5.9 15.1 5.3 14.7 4.9C14.3 4.5 13.7 4.5 13.3 4.9L10 8.2L6.7 4.9C6.3 4.5 5.7 4.5 5.3 4.9C4.9 5.3 4.9 5.9 5.3 6.3L8.6 9.6L5.3 12.9C4.9 13.3 4.9 13.9 5.3 14.3C5.5 14.5 5.8 14.6 6 14.6S6.5 14.5 6.7 14.3L10 11L13.3 14.3C13.5 14.5 13.8 14.6 14 14.6S14.5 14.5 14.7 14.3C15.1 13.9 15.1 13.3 14.7 12.9L11.4 9.6L14.7 6.3Z" fill="currentColor"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Pending Tasks</h4>
                  <p>Track and manage all pending assignments and duties</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="15" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Class/Exam Rescheduling</h4>
                  <p>Easy rescheduling with automated notifications</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2"/>
                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89783 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Manual Marks Entry</h4>
                  <p>Quick and efficient grade recording system</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Batch & Student Management</h4>
                  <p>Organize classes and track student progress</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="13,2 13,9 20,9" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Exam Performance</h4>
                  <p>Detailed analysis of student exam results</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="10" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Salary Summary & Reports</h4>
                  <p>Personal salary tracking and comprehensive analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
