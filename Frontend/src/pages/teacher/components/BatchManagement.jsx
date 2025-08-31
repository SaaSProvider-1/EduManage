import React, { useState } from 'react';
import './BatchManagement.css';

export default function BatchManagement() {
  const [batches] = useState([
    {
      id: 1,
      name: 'Mathematics - Grade 10A',
      subject: 'Mathematics',
      grade: 'Grade 10',
      studentsCount: 25,
      schedule: 'Mon, Wed, Fri - 10:00 AM',
      room: 'Room 101',
      status: 'active'
    },
    {
      id: 2,
      name: 'Physics - Grade 11B',
      subject: 'Physics',
      grade: 'Grade 11',
      studentsCount: 30,
      schedule: 'Tue, Thu - 2:00 PM',
      room: 'Room 203',
      status: 'active'
    },
    {
      id: 3,
      name: 'Chemistry - Grade 12A',
      subject: 'Chemistry',
      grade: 'Grade 12',
      studentsCount: 28,
      schedule: 'Mon, Wed - 11:00 AM',
      room: 'Room 105',
      status: 'active'
    }
  ]);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, students, attendance

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setViewMode('overview');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="batch-management">
      <div className="page-header">
        <h2>Batch Management</h2>
        <p>Manage your teaching batches and student groups</p>
      </div>

      <div className="batch-layout">
        <div className="batches-sidebar">
          <div className="sidebar-header">
            <h3>My Batches</h3>
            <span className="batch-count">{batches.length} batches</span>
          </div>
          
          <div className="batch-list">
            {batches.map(batch => (
              <div 
                key={batch.id}
                className={`batch-item ${selectedBatch?.id === batch.id ? 'selected' : ''}`}
                onClick={() => handleBatchSelect(batch)}
              >
                <div className="batch-item-header">
                  <h4>{batch.name}</h4>
                  <div 
                    className="batch-status"
                    style={{ backgroundColor: getStatusColor(batch.status) }}
                  >
                    {batch.status}
                  </div>
                </div>
                <div className="batch-item-details">
                  <span>👥 {batch.studentsCount} students</span>
                  <span>📍 {batch.room}</span>
                </div>
                <div className="batch-schedule">
                  📅 {batch.schedule}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="batch-details">
          {selectedBatch ? (
            <>
              <div className="batch-details-header">
                <div className="batch-info">
                  <h2>{selectedBatch.name}</h2>
                  <div className="batch-meta">
                    <span className="meta-item">📚 {selectedBatch.subject}</span>
                    <span className="meta-item">🎓 {selectedBatch.grade}</span>
                    <span className="meta-item">👥 {selectedBatch.studentsCount} students</span>
                    <span className="meta-item">📍 {selectedBatch.room}</span>
                  </div>
                </div>
                
                <div className="view-tabs">
                  <button 
                    className={`tab-btn ${viewMode === 'overview' ? 'active' : ''}`}
                    onClick={() => setViewMode('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={`tab-btn ${viewMode === 'students' ? 'active' : ''}`}
                    onClick={() => setViewMode('students')}
                  >
                    Students
                  </button>
                  <button 
                    className={`tab-btn ${viewMode === 'attendance' ? 'active' : ''}`}
                    onClick={() => setViewMode('attendance')}
                  >
                    Attendance
                  </button>
                </div>
              </div>

              <div className="batch-content">
                {viewMode === 'overview' && (
                  <div className="overview-section">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                          <h3>{selectedBatch.studentsCount}</h3>
                          <p>Total Students</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                          <h3>85%</h3>
                          <p>Average Attendance</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-info">
                          <h3>78</h3>
                          <p>Average Score</p>
                        </div>
                      </div>
                    </div>

                    <div className="quick-actions">
                      <h3>Quick Actions</h3>
                      <div className="actions-grid">
                        <button className="action-btn">📝 Take Attendance</button>
                        <button className="action-btn">📋 Create Assignment</button>
                        <button className="action-btn">📊 View Reports</button>
                        <button className="action-btn">💬 Send Message</button>
                      </div>
                    </div>

                    <div className="recent-activities">
                      <h3>Recent Activities</h3>
                      <div className="activity-list">
                        <div className="activity-item">
                          <span className="activity-icon">📝</span>
                          <span className="activity-text">Attendance marked for {new Date().toLocaleDateString()}</span>
                          <span className="activity-time">2 hours ago</span>
                        </div>
                        <div className="activity-item">
                          <span className="activity-icon">📋</span>
                          <span className="activity-text">Assignment created: Chapter 5 Exercises</span>
                          <span className="activity-time">1 day ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'students' && (
                  <div className="students-section">
                    <div className="students-header">
                      <h3>Students List</h3>
                      <button className="add-student-btn">+ Add Student</button>
                    </div>
                    <div className="students-grid">
                      {Array.from({ length: selectedBatch.studentsCount }, (_, i) => (
                        <div key={i} className="student-card">
                          <div className="student-avatar">👤</div>
                          <div className="student-info">
                            <h4>Student {i + 1}</h4>
                            <p>Roll No: 2025{String(i + 1).padStart(3, '0')}</p>
                          </div>
                          <div className="student-actions">
                            <button className="action-icon">👁️</button>
                            <button className="action-icon">✏️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === 'attendance' && (
                  <div className="attendance-section">
                    <div className="attendance-header">
                      <h3>Attendance Management</h3>
                      <div className="attendance-controls">
                        <input type="date" className="date-input" defaultValue={new Date().toISOString().split('T')[0]} />
                        <button className="mark-attendance-btn">Mark Attendance</button>
                      </div>
                    </div>
                    <div className="attendance-summary">
                      <div className="summary-card">
                        <h4>Today's Attendance</h4>
                        <div className="attendance-stats">
                          <span className="present">Present: 22</span>
                          <span className="absent">Absent: 3</span>
                          <span className="percentage">87%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-batch-selected">
              <div className="no-batch-icon">📚</div>
              <h3>Select a batch to view details</h3>
              <p>Choose a batch from the left sidebar to manage students and view analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
