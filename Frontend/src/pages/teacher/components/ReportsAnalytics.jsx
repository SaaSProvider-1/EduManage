import React, { useState } from 'react';
import './ReportsAnalytics.css';

export default function ReportsAnalytics() {
  const [activeReport, setActiveReport] = useState('attendance');
  const [dateRange, setDateRange] = useState('last_month');
  
  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: '👥' },
    { id: 'performance', name: 'Performance Report', icon: '📊' },
    { id: 'batch_summary', name: 'Batch Summary', icon: '📚' },
    { id: 'student_progress', name: 'Student Progress', icon: '📈' }
  ];

  const attendanceData = [
    { batch: 'Mathematics - Grade 10A', present: 23, total: 25, percentage: 92 },
    { batch: 'Physics - Grade 11B', present: 27, total: 30, percentage: 90 },
    { batch: 'Chemistry - Grade 12A', present: 25, total: 28, percentage: 89 }
  ];

  const performanceData = [
    { batch: 'Mathematics - Grade 10A', avgScore: 78, highScore: 95, lowScore: 45, passRate: 84 },
    { batch: 'Physics - Grade 11B', avgScore: 82, highScore: 98, lowScore: 62, passRate: 90 },
    { batch: 'Chemistry - Grade 12A', avgScore: 75, highScore: 92, lowScore: 38, passRate: 79 }
  ];

  const batchSummaryData = [
    {
      batch: 'Mathematics - Grade 10A',
      students: 25,
      avgAttendance: 92,
      avgPerformance: 78,
      assignments: 12,
      completionRate: 88
    },
    {
      batch: 'Physics - Grade 11B',
      students: 30,
      avgAttendance: 90,
      avgPerformance: 82,
      assignments: 15,
      completionRate: 93
    },
    {
      batch: 'Chemistry - Grade 12A',
      students: 28,
      avgAttendance: 89,
      avgPerformance: 75,
      assignments: 18,
      completionRate: 85
    }
  ];

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#f59e0b';
    return '#ef4444';
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const generateReport = () => {
    alert(`Generating ${reportTypes.find(r => r.id === activeReport)?.name} for ${dateRange.replace('_', ' ')}...`);
  };

  const exportReport = (format) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="reports-analytics">
      <div className="page-header">
        <h2>Reports & Analytics</h2>
        <p>Generate comprehensive reports and analyze your teaching data</p>
      </div>

      <div className="reports-controls">
        <div className="report-selector">
          <label>Report Type</label>
          <select 
            value={activeReport} 
            onChange={(e) => setActiveReport(e.target.value)}
            className="report-select"
          >
            {reportTypes.map(report => (
              <option key={report.id} value={report.id}>
                {report.icon} {report.name}
              </option>
            ))}
          </select>
        </div>

        <div className="date-range-selector">
          <label>Date Range</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-select"
          >
            <option value="last_week">Last Week</option>
            <option value="last_month">Last Month</option>
            <option value="last_quarter">Last Quarter</option>
            <option value="current_semester">Current Semester</option>
            <option value="academic_year">Academic Year</option>
          </select>
        </div>

        <div className="report-actions">
          <button className="generate-btn" onClick={generateReport}>
            📊 Generate Report
          </button>
          <div className="export-options">
            <button className="export-btn" onClick={() => exportReport('pdf')}>
              📄 PDF
            </button>
            <button className="export-btn" onClick={() => exportReport('excel')}>
              📊 Excel
            </button>
          </div>
        </div>
      </div>

      <div className="report-content">
        {activeReport === 'attendance' && (
          <div className="attendance-report">
            <div className="report-header">
              <h3>👥 Attendance Report</h3>
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-value">91%</span>
                  <span className="stat-label">Overall Attendance</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">3</span>
                  <span className="stat-label">Total Batches</span>
                </div>
              </div>
            </div>

            <div className="attendance-table">
              <div className="table-header">
                <div className="header-cell">Batch</div>
                <div className="header-cell">Present</div>
                <div className="header-cell">Total</div>
                <div className="header-cell">Percentage</div>
                <div className="header-cell">Status</div>
              </div>
              {attendanceData.map((item, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell batch-name">{item.batch}</div>
                  <div className="table-cell">{item.present}</div>
                  <div className="table-cell">{item.total}</div>
                  <div className="table-cell">
                    <span 
                      className="percentage-badge"
                      style={{ backgroundColor: getAttendanceColor(item.percentage) }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className={`status ${item.percentage >= 90 ? 'excellent' : item.percentage >= 80 ? 'good' : 'poor'}`}>
                      {item.percentage >= 90 ? 'Excellent' : item.percentage >= 80 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="attendance-chart">
              <h4>Attendance Trends</h4>
              <div className="chart-placeholder">
                <p>📊 Attendance trend chart would be displayed here</p>
                <div className="trend-indicators">
                  <span className="trend-up">📈 Overall attendance increased by 3% this month</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'performance' && (
          <div className="performance-report">
            <div className="report-header">
              <h3>📊 Performance Report</h3>
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-value">78</span>
                  <span className="stat-label">Average Score</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">84%</span>
                  <span className="stat-label">Pass Rate</span>
                </div>
              </div>
            </div>

            <div className="performance-table">
              <div className="table-header">
                <div className="header-cell">Batch</div>
                <div className="header-cell">Avg Score</div>
                <div className="header-cell">High Score</div>
                <div className="header-cell">Low Score</div>
                <div className="header-cell">Pass Rate</div>
              </div>
              {performanceData.map((item, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell batch-name">{item.batch}</div>
                  <div className="table-cell">
                    <span 
                      className="score-badge"
                      style={{ color: getPerformanceColor(item.avgScore) }}
                    >
                      {item.avgScore}
                    </span>
                  </div>
                  <div className="table-cell high-score">{item.highScore}</div>
                  <div className="table-cell low-score">{item.lowScore}</div>
                  <div className="table-cell">
                    <span 
                      className="percentage-badge"
                      style={{ backgroundColor: getPerformanceColor(item.passRate) }}
                    >
                      {item.passRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="performance-insights">
              <h4>Performance Insights</h4>
              <div className="insights-grid">
                <div className="insight-card">
                  <span className="insight-icon">🏆</span>
                  <div className="insight-content">
                    <h5>Top Performing Batch</h5>
                    <p>Physics - Grade 11B with 82% average</p>
                  </div>
                </div>
                <div className="insight-card">
                  <span className="insight-icon">⚠️</span>
                  <div className="insight-content">
                    <h5>Needs Attention</h5>
                    <p>Chemistry - Grade 12A needs improvement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'batch_summary' && (
          <div className="batch-summary-report">
            <div className="report-header">
              <h3>📚 Batch Summary Report</h3>
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-value">83</span>
                  <span className="stat-label">Total Students</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">45</span>
                  <span className="stat-label">Total Assignments</span>
                </div>
              </div>
            </div>

            <div className="batch-cards">
              {batchSummaryData.map((batch, index) => (
                <div key={index} className="batch-summary-card">
                  <div className="batch-card-header">
                    <h4>{batch.batch}</h4>
                    <span className="student-count">👥 {batch.students} students</span>
                  </div>
                  
                  <div className="batch-metrics">
                    <div className="metric">
                      <span className="metric-label">Avg Attendance</span>
                      <span 
                        className="metric-value"
                        style={{ color: getAttendanceColor(batch.avgAttendance) }}
                      >
                        {batch.avgAttendance}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Avg Performance</span>
                      <span 
                        className="metric-value"
                        style={{ color: getPerformanceColor(batch.avgPerformance) }}
                      >
                        {batch.avgPerformance}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Assignments</span>
                      <span className="metric-value">{batch.assignments}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Completion Rate</span>
                      <span className="metric-value">{batch.completionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeReport === 'student_progress' && (
          <div className="student-progress-report">
            <div className="report-header">
              <h3>📈 Student Progress Report</h3>
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-value">15</span>
                  <span className="stat-label">Improved Students</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">68</span>
                  <span className="stat-label">Stable Performance</span>
                </div>
              </div>
            </div>

            <div className="progress-overview">
              <h4>Progress Overview</h4>
              <div className="progress-categories">
                <div className="progress-category improving">
                  <div className="category-icon">📈</div>
                  <div className="category-info">
                    <h5>Improving (15 students)</h5>
                    <p>Students showing consistent improvement</p>
                  </div>
                  <div className="category-percentage">18%</div>
                </div>
                <div className="progress-category stable">
                  <div className="category-icon">📊</div>
                  <div className="category-info">
                    <h5>Stable (68 students)</h5>
                    <p>Students maintaining consistent performance</p>
                  </div>
                  <div className="category-percentage">82%</div>
                </div>
              </div>
            </div>

            <div className="detailed-progress">
              <h4>Detailed Progress Analysis</h4>
              <div className="progress-placeholder">
                <p>📊 Individual student progress charts would be displayed here</p>
                <p>Including semester-wise performance trends and recommendations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
