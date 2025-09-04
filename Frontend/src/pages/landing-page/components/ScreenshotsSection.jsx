import React, { useState } from 'react';
import './ScreenshotsSection.css';

const ScreenshotsSection = () => {
  const [activeTab, setActiveTab] = useState('admin');

  const screenshots = {
    admin: [
      {
        title: "Admin Dashboard Overview",
        description: "Complete institutional overview with real-time statistics and key metrics",
        image: "/images/admin-dashboard.jpg"
      },
      {
        title: "Student Management",
        description: "Comprehensive student profiles, enrollment tracking, and academic records",
        image: "/images/student-management.jpg"
      },
      {
        title: "Fee Management",
        description: "Automated fee collection, payment tracking, and financial reporting",
        image: "/images/fee-management.jpg"
      }
    ],
    teacher: [
      {
        title: "Teacher Dashboard",
        description: "Personalized workspace with pending tasks and class schedules",
        image: "/images/teacher-dashboard.jpg"
      },
      {
        title: "Grade Management",
        description: "Easy grade entry, exam scheduling, and performance tracking",
        image: "/images/grade-management.jpg"
      },
      {
        title: "Class Scheduling",
        description: "Flexible class rescheduling with automatic notifications",
        image: "/images/class-scheduling.jpg"
      }
    ]
  };

  return (
    <section className="screenshots-section section section-light">
      <div className="screenshots-container">
        <div className="section-header text-center animate-on-scroll">
          <h2 className="heading-lg">
            See <span className="text-primary">EduManage</span> in Action
          </h2>
          <p className="text-lg">
            Explore our intuitive dashboards designed for modern educational institutions
          </p>
        </div>

        <div className="screenshots-tabs animate-on-scroll">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <div className="tab-icon admin">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="tab-info">
                <span className="tab-title">Admin Panel</span>
                <span className="tab-desc">Complete institutional control</span>
              </div>
            </button>
            <button 
              className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
              onClick={() => setActiveTab('teacher')}
            >
              <div className="tab-icon teacher">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 10V6C22 5.46957 21.7893 4.96086 21.4142 4.58579C21.0391 4.21071 20.5304 4 20 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H12" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 8H22" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 22L20 20" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="tab-info">
                <span className="tab-title">Teacher Panel</span>
                <span className="tab-desc">Streamlined teaching tools</span>
              </div>
            </button>
          </div>
        </div>

        <div className="screenshots-content animate-on-scroll">
          <div className="screenshots-grid grid grid-3">
            {screenshots[activeTab].map((screenshot, index) => (
              <div key={index} className="screenshot-card card">
                <div className="screenshot-image">
                  <div className="image-placeholder">
                    <div className="mockup-browser">
                      <div className="browser-header">
                        <div className="browser-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <div className="browser-url">edumanage.com/{activeTab}</div>
                      </div>
                      <div className="browser-content">
                        <div className="content-header">
                          <div className="header-avatar"></div>
                          <div className="header-info">
                            <div className="header-title">{screenshot.title}</div>
                            <div className="header-subtitle">Dashboard</div>
                          </div>
                          <div className="header-actions">
                            <div className="action-btn"></div>
                            <div className="action-btn"></div>
                          </div>
                        </div>
                        <div className="content-body">
                          <div className="content-sidebar">
                            <div className="sidebar-menu">
                              <div className="menu-item active"></div>
                              <div className="menu-item"></div>
                              <div className="menu-item"></div>
                              <div className="menu-item"></div>
                              <div className="menu-item"></div>
                            </div>
                          </div>
                          <div className="content-main">
                            <div className="main-stats">
                              <div className="stat-card">
                                <div className="stat-icon"></div>
                                <div className="stat-text"></div>
                              </div>
                              <div className="stat-card">
                                <div className="stat-icon"></div>
                                <div className="stat-text"></div>
                              </div>
                              <div className="stat-card">
                                <div className="stat-icon"></div>
                                <div className="stat-text"></div>
                              </div>
                            </div>
                            <div className="main-chart">
                              <div className="chart-bars">
                                <div className="chart-bar" style={{height: '40%'}}></div>
                                <div className="chart-bar" style={{height: '70%'}}></div>
                                <div className="chart-bar" style={{height: '50%'}}></div>
                                <div className="chart-bar" style={{height: '80%'}}></div>
                                <div className="chart-bar" style={{height: '60%'}}></div>
                                <div className="chart-bar" style={{height: '90%'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="screenshot-info">
                  <h3 className="heading-sm">{screenshot.title}</h3>
                  <p>{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="feature-highlights animate-on-scroll">
          <div className="highlights-grid grid grid-2">
            <div className="highlight-item">
              <div className="highlight-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="13,2 13,9 20,9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="highlight-text">
                <h4>Comprehensive Reports</h4>
                <p>Generate detailed reports on attendance, performance, fees, and more with just one click.</p>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="highlight-text">
                <h4>Secure & Reliable</h4>
                <p>Bank-level security ensures your data is always protected with 99.9% uptime guarantee.</p>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="highlight-text">
                <h4>Mobile Responsive</h4>
                <p>Access your dashboard from anywhere, anytime with our fully responsive web application.</p>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.7 6.3C15.1 5.9 15.1 5.3 14.7 4.9C14.3 4.5 13.7 4.5 13.3 4.9L10 8.2L6.7 4.9C6.3 4.5 5.7 4.5 5.3 4.9C4.9 5.3 4.9 5.9 5.3 6.3L8.6 9.6L5.3 12.9C4.9 13.3 4.9 13.9 5.3 14.3C5.5 14.5 5.8 14.6 6 14.6S6.5 14.5 6.7 14.3L10 11L13.3 14.3C13.5 14.5 13.8 14.6 14 14.6S14.5 14.5 14.7 14.3C15.1 13.9 15.1 13.3 14.7 12.9L11.4 9.6L14.7 6.3Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="highlight-text">
                <h4>Easy Integration</h4>
                <p>Seamlessly integrate with existing systems and export data in various formats.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection;
