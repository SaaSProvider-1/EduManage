import React from 'react';
import './BenefitsSection.css';

const BenefitsSection = () => {
  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <polyline points="10,6 10,12 14,14" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "Save Time",
      description: "Automate routine tasks and reduce administrative workload by up to 70%. Focus on what matters most - education."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
          <path d="M17 5H9.5C8.11929 5 7 6.11929 7 7.5S8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5S15.8807 15 14.5 15H9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "Track Fees & Attendance",
      description: "Monitor fee payments and attendance patterns with real-time updates and automated reminders for better financial management."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 10V6C22 5.46957 21.7893 4.96086 21.4142 4.58579C21.0391 4.21071 20.5304 4 20 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H12" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 8H22" stroke="currentColor" strokeWidth="2"/>
          <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 22L20 20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "Improve Student Performance",
      description: "Track academic progress, identify struggling students early, and provide targeted support to enhance overall performance."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 12L11 8L15 12L21 6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: "Boost Productivity",
      description: "Streamline workflows, eliminate paperwork, and increase efficiency across all departments with integrated management tools."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Ensure Data Security",
      description: "Keep sensitive information safe with enterprise-grade security, regular backups, and role-based access controls."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.7032C21.7033 16.0523 20.9976 15.5987 20.208 15.4135" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.7904 3.31548 17.4961 3.76907 18.0022 4.41993C18.5083 5.07079 18.7928 5.88121 18.7928 6.71658C18.7928 7.55195 18.5083 8.36237 18.0022 9.01323C17.4961 9.66409 16.7904 10.1177 16 10.303" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Better Communication",
      description: "Facilitate seamless communication between teachers, students, and parents with integrated messaging and notification systems."
    }
  ];

  return (
    <section className="benefits-section section section-white">
      <div className="benefits-container">
        <div className="section-header text-center animate-on-scroll">
          <h2 className="heading-lg">
            Why Choose <span className="text-primary">EduManage</span>?
          </h2>
          <p className="text-lg">
            Transform your educational institution with powerful benefits that drive success
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card card animate-on-scroll">
              <div className="benefit-card-body">
                <div className="benefit-icon">
                  {benefit.icon}
                </div>
                <h3 className="benefit-title heading-sm">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
              <div className="benefit-hover-effect"></div>
            </div>
          ))}
        </div>

        <div className="benefits-stats animate-on-scroll">
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime Guaranteed</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">10+</div>
              <div className="stat-label">Hours Saved Weekly</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Happy Institutions</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Expert Support</div>
            </div>
          </div>
        </div>

        <div className="cta-section animate-on-scroll">
          <div className="cta-content">
            <h3 className="heading-md">Ready to Transform Your Institution?</h3>
            <p className="text-lg">Join hundreds of educational institutions already using EduManage to streamline their operations.</p>
            <div className="cta-buttons">
              <a href="#pricing" className="btn btn-primary btn-large">
                Get Started
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
