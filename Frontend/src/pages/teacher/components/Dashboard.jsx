import React, { useState } from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const [stats] = useState({
    myBatches: 5,
    totalStudents: 125,
    pendingTasks: 8,
    upcomingClasses: 3,
    attendanceToday: 92,
    assignmentsToGrade: 15
  });

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h2>Teacher Dashboard</h2>
        <div className="welcome-message">
          <span className="greeting-icon">👋</span>
          <span>Welcome back, Teacher!</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card batches">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{stats.myBatches}</h3>
            <p>My Batches</p>
          </div>
        </div>

        <div className="stat-card students">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card dash-pending-tasks">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>

        <div className="stat-card attendance">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.attendanceToday}%</h3>
            <p>Today's Attendance</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section upcoming-classes">
          <h3>Upcoming Classes</h3>
          <div className="class-list">
            <div className="class-item">
              <span className="class-time">10:00 AM</span>
              <span className="class-subject">Mathematics - Grade 10</span>
              <span className="class-room">Room 101</span>
            </div>
            <div className="class-item">
              <span className="class-time">2:00 PM</span>
              <span className="class-subject">Physics - Grade 11</span>
              <span className="class-room">Room 203</span>
            </div>
            <div className="class-item">
              <span className="class-time">4:00 PM</span>
              <span className="class-subject">Chemistry - Grade 12</span>
              <span className="class-room">Room 105</span>
            </div>
          </div>
        </div>

        <div className="section recent-activities">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">📝</span>
              <div className="activity-content">
                <span className="activity-text">Graded Math Quiz - Grade 10</span>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📅</span>
              <div className="activity-content">
                <span className="activity-text">Scheduled Physics Exam</span>
                <span className="activity-time">4 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">👥</span>
              <div className="activity-content">
                <span className="activity-text">Updated attendance for Batch A</span>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="dash-action-btn mark-attendance">
            <span className="action-icon">✅</span>
            <span>Mark Attendance</span>
          </button>
          <button className="dash-action-btn create-assignment">
            <span className="action-icon">📋</span>
            <span>Create Assignment</span>
          </button>
          <button className="dash-action-btn schedule-exam">
            <span className="action-icon">📝</span>
            <span>Schedule Exam</span>
          </button>
          <button className="dash-action-btn view-reports">
            <span className="action-icon">📊</span>
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
