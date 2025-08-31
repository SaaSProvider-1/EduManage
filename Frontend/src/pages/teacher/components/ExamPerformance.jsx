import React, { useState } from 'react';
import './ExamPerformance.css';

export default function ExamPerformance() {
  const [examData] = useState([
    {
      id: 1,
      examName: 'Mid-term Mathematics',
      batch: 'Grade 10A',
      date: '2025-08-15',
      totalStudents: 25,
      averageScore: 78,
      highestScore: 95,
      lowestScore: 45,
      passRate: 84
    },
    {
      id: 2,
      examName: 'Physics Quiz 1',
      batch: 'Grade 11B',
      date: '2025-08-20',
      totalStudents: 30,
      averageScore: 82,
      highestScore: 98,
      lowestScore: 62,
      passRate: 90
    },
    {
      id: 3,
      examName: 'Chemistry Final',
      batch: 'Grade 12A',
      date: '2025-08-25',
      totalStudents: 28,
      averageScore: 75,
      highestScore: 92,
      lowestScore: 38,
      passRate: 79
    }
  ]);

  const [studentPerformance] = useState([
    { name: 'John Doe', rollNo: '2025001', score: 85, grade: 'A', remarks: 'Excellent' },
    { name: 'Jane Smith', rollNo: '2025002', score: 78, grade: 'B+', remarks: 'Good' },
    { name: 'Mike Johnson', rollNo: '2025003', score: 92, grade: 'A+', remarks: 'Outstanding' },
    { name: 'Sarah Wilson', rollNo: '2025004', score: 67, grade: 'B', remarks: 'Satisfactory' },
    { name: 'David Brown', rollNo: '2025005', score: 45, grade: 'D', remarks: 'Needs Improvement' }
  ]);

  const [selectedExam, setSelectedExam] = useState(examData[0]);
  const [activeTab, setActiveTab] = useState('overview');

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return '#10b981';
      case 'A': return '#059669';
      case 'B+': return '#3b82f6';
      case 'B': return '#6366f1';
      case 'C': return '#f59e0b';
      case 'D': return '#ef4444';
      case 'F': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPerformanceStats = () => {
    const totalStudents = studentPerformance.length;
    const excellent = studentPerformance.filter(s => s.score >= 90).length;
    const good = studentPerformance.filter(s => s.score >= 75 && s.score < 90).length;
    const average = studentPerformance.filter(s => s.score >= 60 && s.score < 75).length;
    const poor = studentPerformance.filter(s => s.score < 60).length;

    return { totalStudents, excellent, good, average, poor };
  };

  const stats = getPerformanceStats();

  return (
    <div className="exam-performance">
      <div className="page-header">
        <h2>Exam Performance</h2>
        <p>Analyze and track student performance across all examinations</p>
      </div>

      <div className="performance-layout">
        <div className="exams-sidebar">
          <div className="sidebar-header">
            <h3>Recent Exams</h3>
          </div>
          
          <div className="exam-list">
            {examData.map(exam => (
              <div 
                key={exam.id}
                className={`exam-item ${selectedExam.id === exam.id ? 'selected' : ''}`}
                onClick={() => setSelectedExam(exam)}
              >
                <div className="exam-item-header">
                  <h4>{exam.examName}</h4>
                  <span className="exam-date">{new Date(exam.date).toLocaleDateString()}</span>
                </div>
                <div className="exam-item-details">
                  <span>📚 {exam.batch}</span>
                  <span>👥 {exam.totalStudents} students</span>
                </div>
                <div className="exam-average">
                  Average: <strong>{exam.averageScore}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="performance-content">
          <div className="content-header">
            <div className="exam-title">
              <h2>{selectedExam.examName}</h2>
              <div className="exam-meta">
                <span>📚 {selectedExam.batch}</span>
                <span>📅 {new Date(selectedExam.date).toLocaleDateString()}</span>
                <span>👥 {selectedExam.totalStudents} students</span>
              </div>
            </div>
            
            <div className="performance-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                Student Scores
              </button>
              <button 
                className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="performance-summary">
                  <div className="summary-card">
                    <div className="summary-icon">📊</div>
                    <div className="summary-info">
                      <h3>{selectedExam.averageScore}%</h3>
                      <p>Average Score</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">🏆</div>
                    <div className="summary-info">
                      <h3>{selectedExam.highestScore}%</h3>
                      <p>Highest Score</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">📉</div>
                    <div className="summary-info">
                      <h3>{selectedExam.lowestScore}%</h3>
                      <p>Lowest Score</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">✅</div>
                    <div className="summary-info">
                      <h3>{selectedExam.passRate}%</h3>
                      <p>Pass Rate</p>
                    </div>
                  </div>
                </div>

                <div className="performance-distribution">
                  <h3>Performance Distribution</h3>
                  <div className="distribution-chart">
                    <div className="distribution-bar">
                      <div className="bar-section excellent" style={{width: `${(stats.excellent / stats.totalStudents) * 100}%`}}>
                        <span>Excellent (90-100%)</span>
                        <span>{stats.excellent} students</span>
                      </div>
                      <div className="bar-section good" style={{width: `${(stats.good / stats.totalStudents) * 100}%`}}>
                        <span>Good (75-89%)</span>
                        <span>{stats.good} students</span>
                      </div>
                      <div className="bar-section average" style={{width: `${(stats.average / stats.totalStudents) * 100}%`}}>
                        <span>Average (60-74%)</span>
                        <span>{stats.average} students</span>
                      </div>
                      <div className="bar-section poor" style={{width: `${(stats.poor / stats.totalStudents) * 100}%`}}>
                        <span>Poor (&lt;60%)</span>
                        <span>{stats.poor} students</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="quick-insights">
                  <h3>Quick Insights</h3>
                  <div className="insights-grid">
                    <div className="insight-card">
                      <h4>Top Performer</h4>
                      <p>Mike Johnson with 92%</p>
                    </div>
                    <div className="insight-card">
                      <h4>Needs Attention</h4>
                      <p>David Brown with 45%</p>
                    </div>
                    <div className="insight-card">
                      <h4>Class Performance</h4>
                      <p>Above average compared to previous exams</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="students-tab">
                <div className="students-table">
                  <div className="table-header">
                    <div className="header-cell">Student Name</div>
                    <div className="header-cell">Roll No</div>
                    <div className="header-cell">Score</div>
                    <div className="header-cell">Grade</div>
                    <div className="header-cell">Remarks</div>
                    <div className="header-cell">Actions</div>
                  </div>
                  {studentPerformance
                    .sort((a, b) => b.score - a.score)
                    .map((student, index) => (
                    <div key={index} className="table-row">
                      <div className="table-cell">
                        <div className="student-info">
                          <span className="rank">#{index + 1}</span>
                          <span>{student.name}</span>
                        </div>
                      </div>
                      <div className="table-cell">{student.rollNo}</div>
                      <div className="table-cell">
                        <span className="score">{student.score}%</span>
                      </div>
                      <div className="table-cell">
                        <span 
                          className="grade-badge"
                          style={{ backgroundColor: getGradeColor(student.grade) }}
                        >
                          {student.grade}
                        </span>
                      </div>
                      <div className="table-cell remarks">{student.remarks}</div>
                      <div className="table-cell">
                        <button className="action-btn-small">📊 Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="analytics-tab">
                <div className="analytics-section">
                  <h3>Grade Distribution</h3>
                  <div className="grade-distribution">
                    {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(grade => {
                      const count = studentPerformance.filter(s => s.grade === grade).length;
                      const percentage = (count / studentPerformance.length) * 100;
                      return (
                        <div key={grade} className="grade-item">
                          <span className="grade-label">{grade}</span>
                          <div className="grade-bar">
                            <div 
                              className="grade-fill"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: getGradeColor(grade)
                              }}
                            ></div>
                          </div>
                          <span className="grade-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="comparison-section">
                  <h3>Exam Comparison</h3>
                  <div className="comparison-chart">
                    <div className="chart-placeholder">
                      <p>📊 Comparison chart with previous exams would be displayed here</p>
                      <div className="chart-stats">
                        <div className="stat">Current Exam: {selectedExam.averageScore}%</div>
                        <div className="stat">Previous Exam: 76%</div>
                        <div className="stat">Improvement: +{selectedExam.averageScore - 76}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
