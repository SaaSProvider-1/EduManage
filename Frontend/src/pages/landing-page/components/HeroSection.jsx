import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text animate-on-scroll fade-in-up">
            <h1 className="heading-xl">
              Smart Education Management <span className="text-primary">Made Easy</span>
            </h1>
            <p className="text-lg hero-subtitle">
              Manage teachers, students, batches, fees, attendance, and exams from one simple dashboard. 
              Streamline your educational institution with our comprehensive management platform.
            </p>
            <div className="hero-buttons">
              <a href="#pricing" className="start-btn start-btn-primary btn-large">
                Get Started
              </a>
              <a href="#contact" className="req-btn btn-outline btn-large">
                Request Demo
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="hero-stat-number">500+</span>
                <span className="hero-stat-label">Schools Trust Us</span>
              </div>
              <div className="stat-item">
                <span className="hero-stat-number">50K+</span>
                <span className="hero-stat-label">Students Managed</span>
              </div>
              <div className="stat-item">
                <span className="hero-stat-number">99.9%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div className="hero-illustration animate-on-scroll slide-in-right">
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mockup-title">EduManage Dashboard</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-sidebar">
                  <div className="sidebar-item active">
                    <div className="sidebar-icon dashboard"></div>
                    <span>Dashboard</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="sidebar-icon students"></div>
                    <span>Students</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="sidebar-icon teachers"></div>
                    <span>Teachers</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="sidebar-icon batches"></div>
                    <span>Batches</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="sidebar-icon fees"></div>
                    <span>Fees</span>
                  </div>
                </div>
                <div className="mockup-main">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon students"></div>
                      <div className="stat-info">
                        <span className="stat-value">1,234</span>
                        <span className="stat-name">Students</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon teachers"></div>
                      <div className="stat-info">
                        <span className="stat-value">56</span>
                        <span className="stat-name">Teachers</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon batches"></div>
                      <div className="stat-info">
                        <span className="stat-value">24</span>
                        <span className="stat-name">Batches</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon fees"></div>
                      <div className="stat-info">
                        <span className="stat-value">₹2.4M</span>
                        <span className="stat-name">Revenue</span>
                      </div>
                    </div>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-bars">
                      <div className="bar" style={{height: '60%'}}></div>
                      <div className="bar" style={{height: '80%'}}></div>
                      <div className="bar" style={{height: '40%'}}></div>
                      <div className="bar" style={{height: '90%'}}></div>
                      <div className="bar" style={{height: '70%'}}></div>
                      <div className="bar" style={{height: '85%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
