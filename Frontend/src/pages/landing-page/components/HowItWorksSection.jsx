import React, { useState } from 'react';
import './HowItWorksSection.css';

const HowItWorksSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Quick Setup & Registration",
      description: "Set up your coaching center profile and start registering students and batches within minutes",
      icon: "🎯",
      demo: {
        title: "Center Registration",
        steps: ["Center Details", "Batch Structure", "Student Enrollment", "Fee Configuration"]
      }
    },
    {
      title: "Daily Operations Management",
      description: "Handle attendance, batch schedules, and student progress tracking effortlessly",
      icon: "📚",
      demo: {
        title: "Daily Dashboard",
        operations: ["Mark Attendance", "View Batch Schedule", "Track Student Progress", "Generate Reports"]
      }
    },
    {
      title: "Exam & Assessment System",
      description: "Create exams, manage results, and provide detailed performance analytics to students and parents",
      icon: "�",
      demo: {
        title: "Exam Management",
        features: ["Create Test Papers", "Record Results", "Performance Analytics", "Parent Notifications"]
      }
    }
  ];

  return (
    <section className="how-it-works-section section-light">
      <div className="how-container">
        <div className="section-header text-center animate-on-scroll">
          <span className="section-badge">How It Works</span>
          <h2 className="heading-lg">
            Streamline Your Coaching Center in <span className="text-gradient">3 Simple Steps</span>
          </h2>
          <p className="text-lg">
            From student enrollment to exam results - manage everything in one powerful platform
          </p>
        </div>

        <div className="interactive-demo animate-on-scroll">
          <div className="feature-tabs">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`feature-tab ${activeFeature === index ? 'active' : ''}`}
                onClick={() => setActiveFeature(index)}
              >
                <span className="feature-icon">{feature.icon}</span>
                <div className="feature-info">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <div className="step-number">{index + 1}</div>
              </button>
            ))}
          </div>

          <div className="demo-showcase">
            <div className="demo-window">
              <div className="window-header">
                <div className="window-controls">
                  <span className="control red"></span>
                  <span className="control yellow"></span>
                  <span className="control green"></span>
                </div>
                <div className="window-title">{features[activeFeature].demo.title}</div>
              </div>
              <div className="window-content">
                {activeFeature === 0 && (
                  <div className="setup-demo">
                    <div className="setup-steps">
                      {features[0].demo.steps.map((step, index) => (
                        <div key={index} className={`setup-step completed`}>
                          <div className="step-indicator">✓</div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="setup-summary">
                      <div className="how-summary-card">
                        <div className="summary-icon">🏢</div>
                        <div className="summary-text">
                          <strong>Center Ready!</strong>
                          <p>Your coaching center is now set up and ready to manage students</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeFeature === 1 && (
                  <div className="operations-demo">
                    <div className="dashboard-overview">
                      <div className="quick-stats">
                        <div className="stat-item">
                          <div className="stat-value">156</div>
                          <div className="stat-label">Students</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">12</div>
                          <div className="stat-label">Batches</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">94%</div>
                          <div className="stat-label">Attendance</div>
                        </div>
                      </div>
                      <div className="operation-tasks">
                        {features[1].demo.operations.map((operation, index) => (
                          <div key={index} className="operation-item">
                            <div className="operation-icon">
                              {index === 0 && "✅"}
                              {index === 1 && "📅"}
                              {index === 2 && "📈"}
                              {index === 3 && "📊"}
                            </div>
                            <div className="operation-content">
                              <div className="operation-title">{operation}</div>
                              <div className="operation-status">Ready</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeFeature === 2 && (
                  <div className="exam-demo">
                    <div className="exam-interface">
                      <div className="exam-header">
                        <h4>Mathematics - Unit Test 3</h4>
                        <div className="exam-meta">
                          <span>50 Students • 100 Marks • 2 Hours</span>
                        </div>
                      </div>
                      <div className="exam-features">
                        {features[2].demo.features.map((feature, index) => (
                          <div key={index} className="exam-feature">
                            <div className="feature-status completed"></div>
                            <div className="feature-content">
                              <div className="feature-name">{feature}</div>
                              <div className="feature-description">
                                {index === 0 && "Questions added and organized"}
                                {index === 1 && "Results recorded for all students"}
                                {index === 2 && "Detailed analytics generated"}
                                {index === 3 && "Parents notified via SMS/Email"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="coaching-benefits animate-on-scroll">
          <h3>Why Coaching Centers Choose EduManage</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">📋</div>
              <div className="benefit-content">
                <h4>Attendance Management</h4>
                <p>Digital attendance tracking with SMS notifications to parents. No more manual registers.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">👨‍</div>
              <div className="benefit-content">
                <h4>Student & Batch Management</h4>
                <p>Organize students into batches, track fees, manage schedules, and maintain detailed records.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🎯</div>
              <div className="benefit-content">
                <h4>Exam & Result System</h4>
                <p>Create tests, record marks, generate report cards, and share results instantly with parents.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📱</div>
              <div className="benefit-content">
                <h4>Parent Communication</h4>
                <p>Automated SMS/Email for attendance, fees, results, and announcements. Keep parents informed.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="how-cta-section animate-on-scroll">
          <div className="how-cta-content">
            <h3>Ready to Modernize Your Coaching Center?</h3>
            <p>Join hundreds of successful coaching centers already using EduManage</p>
            <div className="cta-buttons">
              <button className="btn btn-primary">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
