import React, { useState } from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const [stats] = useState({
    totalTeachers: 45,
    totalStudents: 1250,
    totalBatches: 12,
    pendingFees: 25000,
    collectedFees: 185000,
    attendance: 89
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="quick-alert">
          <span className="alert-icon">🔔</span>
          <span>3 pending approvals</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card teachers">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-info">
            <h3>{stats.totalTeachers}</h3>
            <p>Total Teachers</p>
          </div>
        </div>

        <div className="stat-card students">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card batches">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{stats.totalBatches}</h3>
            <p>Total Batches</p>
          </div>
        </div>

        <div className="stat-card attendance">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.attendance}%</h3>
            <p>Attendance Summary</p>
          </div>
        </div>
      </div>

      <div className="summary-section">
        <div className="fees-summary">
          <h3>Fees Management Summary</h3>
          <div className="fees-breakdown">
            <div className="fee-item collected">
              <span className="fee-label">Collected</span>
              <span className="fee-amount">₹{stats.collectedFees.toLocaleString()}</span>
            </div>
            <div className="fee-item pending">
              <span className="fee-label">Pending</span>
              <span className="fee-amount">₹{stats.pendingFees.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <span>New student registration: John Doe</span>
              <span className="activity-time">2 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">💰</span>
              <span>Fee payment received from Sarah Smith</span>
              <span className="activity-time">4 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📋</span>
              <span>New batch created: Physics Advanced</span>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
