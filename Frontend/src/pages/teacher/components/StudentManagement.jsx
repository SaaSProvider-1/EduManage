import React, { useState } from 'react';
import './StudentManagement.css';

export default function StudentManagement() {
  const [students] = useState([
    {
      id: 1,
      name: 'John Doe',
      rollNo: '2025001',
      batch: 'Mathematics - Grade 10A',
      email: 'john.doe@school.com',
      phone: '+1 234-567-8901',
      attendance: 92,
      avgScore: 85,
      status: 'active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      rollNo: '2025002',
      batch: 'Physics - Grade 11B',
      email: 'jane.smith@school.com',
      phone: '+1 234-567-8902',
      attendance: 88,
      avgScore: 78,
      status: 'active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      rollNo: '2025003',
      batch: 'Chemistry - Grade 12A',
      email: 'mike.johnson@school.com',
      phone: '+1 234-567-8903',
      attendance: 95,
      avgScore: 92,
      status: 'active'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      rollNo: '2025004',
      batch: 'Mathematics - Grade 10A',
      email: 'sarah.wilson@school.com',
      phone: '+1 234-567-8904',
      attendance: 82,
      avgScore: 75,
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const batches = ['Mathematics - Grade 10A', 'Physics - Grade 11B', 'Chemistry - Grade 12A'];

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBatch = !selectedBatch || student.batch === selectedBatch;
      return matchesSearch && matchesBatch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'attendance') return b.attendance - a.attendance;
      if (sortBy === 'avgScore') return b.avgScore - a.avgScore;
      return 0;
    });

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return '#10b981';
    if (attendance >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="student-management">
      <div className="page-header">
        <h2>Student Management</h2>
        <p>View and manage students from your batches</p>
      </div>

      <div className="controls-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search students by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="filter-select"
          >
            <option value="">All Batches</option>
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="attendance">Sort by Attendance</option>
            <option value="avgScore">Sort by Average Score</option>
          </select>
        </div>

        <div className="stats-summary">
          <div className="summary-item">
            <span className="summary-number">{filteredStudents.length}</span>
            <span className="summary-label">Students</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">
              {Math.round(filteredStudents.reduce((sum, s) => sum + s.attendance, 0) / filteredStudents.length) || 0}%
            </span>
            <span className="summary-label">Avg Attendance</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">
              {Math.round(filteredStudents.reduce((sum, s) => sum + s.avgScore, 0) / filteredStudents.length) || 0}
            </span>
            <span className="summary-label">Avg Score</span>
          </div>
        </div>
      </div>

      <div className="students-grid">
        {filteredStudents.map(student => (
          <div key={student.id} className="student-card">
            <div className="student-header">
              <div className="student-avatar">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="student-basic-info">
                <h3>{student.name}</h3>
                <p className="roll-number">Roll No: {student.rollNo}</p>
                <p className="batch-name">{student.batch}</p>
              </div>
              <button 
                className="view-details-btn"
                onClick={() => setSelectedStudent(student)}
              >
                👁️
              </button>
            </div>

            <div className="student-stats">
              <div className="stat-item">
                <span className="stat-label">Attendance</span>
                <span 
                  className="stat-value"
                  style={{ color: getAttendanceColor(student.attendance) }}
                >
                  {student.attendance}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Score</span>
                <span 
                  className="stat-value"
                  style={{ color: getScoreColor(student.avgScore) }}
                >
                  {student.avgScore}
                </span>
              </div>
            </div>

            <div className="student-man-actions">
              <button className="stu-action-btn message-btn">💬 Message</button>
              <button className="stu-action-btn report-btn">📊 Reports</button>
            </div>
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div className="modal-overlay">
          <div className="student-details-modal">
            <div className="modal-header">
              <h3>Student Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="student-profile">
                <div className="profile-avatar">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="profile-info">
                  <h2>{selectedStudent.name}</h2>
                  <p>Roll No: {selectedStudent.rollNo}</p>
                  <p>Batch: {selectedStudent.batch}</p>
                </div>
              </div>

              <div className="contact-info">
                <h4>Contact Information</h4>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <span>{selectedStudent.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📱</span>
                    <span>{selectedStudent.phone}</span>
                  </div>
                </div>
              </div>

              <div className="performance-section">
                <h4>Performance Overview</h4>
                <div className="performance-stats">
                  <div className="perf-stat">
                    <span className="perf-label">Attendance Rate</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${selectedStudent.attendance}%`,
                          backgroundColor: getAttendanceColor(selectedStudent.attendance)
                        }}
                      ></div>
                    </div>
                    <span className="perf-value">{selectedStudent.attendance}%</span>
                  </div>
                  <div className="perf-stat">
                    <span className="perf-label">Average Score</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${selectedStudent.avgScore}%`,
                          backgroundColor: getScoreColor(selectedStudent.avgScore)
                        }}
                      ></div>
                    </div>
                    <span className="perf-value">{selectedStudent.avgScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions-modal">
                <h4>Quick Actions</h4>
                <div className="modal-actions">
                  <button className="modal-action-btn">📝 Add Remarks</button>
                  <button className="modal-action-btn">📊 View Full Report</button>
                  <button className="modal-action-btn">💬 Send Message</button>
                  <button className="modal-action-btn">📞 Contact Parent</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="no-students">
          <div className="no-students-icon">👥</div>
          <h3>No students found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
