import React, { useState } from 'react';
import './ReportsAnalytics.css';

export default function ReportsAnalytics() {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('month');
  
  const reportData = {
    attendance: {
      overall: 87.5,
      byBatch: [
        { batch: 'Physics A', percentage: 92 },
        { batch: 'Chemistry B', percentage: 85 },
        { batch: 'Math Advanced', percentage: 88 },
        { batch: 'Biology A', percentage: 79 }
      ]
    },
    financial: {
      totalCollected: 850000,
      totalPending: 125000,
      expenses: 320000,
      profit: 530000
    },
    student: {
      totalEnrolled: 1250,
      newEnrollments: 45,
      dropouts: 8,
      retentionRate: 94.2
    }
  };

  const generateReport = () => {
    alert(`Generating ${reportType} report for ${dateRange}`);
  };

  const exportData = () => {
    alert('Exporting report data...');
  };

  return (
    <div className="reports-analytics">
      <div className="reports-header">
        <h2>Reports & Analytics</h2>
        <div className="report-actions">
          <button className="btn btn-secondary" onClick={exportData}>Export Data</button>
          <button className="btn btn-primary" onClick={generateReport}>Generate Report</button>
        </div>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <label>Report Type:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="filter-select"
          >
            <option value="attendance">Attendance Report</option>
            <option value="financial">Financial Report</option>
            <option value="student">Student Report</option>
            <option value="teacher">Teacher Performance</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Date Range:</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="analytics-dashboard">
        {reportType === 'attendance' && (
          <div className="report-section">
            <div className="metric-cards">
              <div className="metric-card primary">
                <div className="metric-value">{reportData.attendance.overall}%</div>
                <div className="metric-label">Overall Attendance</div>
                <div className="metric-trend positive">↗ +2.3%</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">92%</div>
                <div className="metric-label">Best Batch</div>
                <div className="metric-subtitle">Physics A</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">79%</div>
                <div className="metric-label">Needs Attention</div>
                <div className="metric-subtitle">Biology A</div>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Attendance by Batch</h3>
              <div className="bar-chart">
                {reportData.attendance.byBatch.map(batch => (
                  <div key={batch.batch} className="bar-item">
                    <div className="bar-label">{batch.batch}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${batch.percentage}%` }}
                      ></div>
                      <span className="bar-percentage">{batch.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === 'financial' && (
          <div className="report-section">
            <div className="metric-cards">
              <div className="metric-card success">
                <div className="metric-value">₹{reportData.financial.totalCollected.toLocaleString()}</div>
                <div className="metric-label">Total Collected</div>
                <div className="metric-trend positive">↗ +15%</div>
              </div>
              <div className="metric-card warning">
                <div className="metric-value">₹{reportData.financial.totalPending.toLocaleString()}</div>
                <div className="metric-label">Pending Fees</div>
                <div className="metric-trend negative">↗ -5%</div>
              </div>
              <div className="metric-card info">
                <div className="metric-value">₹{reportData.financial.expenses.toLocaleString()}</div>
                <div className="metric-label">Total Expenses</div>
              </div>
              <div className="metric-card primary">
                <div className="metric-value">₹{reportData.financial.profit.toLocaleString()}</div>
                <div className="metric-label">Net Profit</div>
                <div className="metric-trend positive">↗ +22%</div>
              </div>
            </div>
            
            <div className="financial-breakdown">
              <h3>Revenue Breakdown</h3>
              <div className="breakdown-chart">
                <div className="pie-chart">
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color collected"></div>
                      <span>Collected (85%)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color pending"></div>
                      <span>Pending (15%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'student' && (
          <div className="report-section">
            <div className="metric-cards">
              <div className="metric-card primary">
                <div className="metric-value">{reportData.student.totalEnrolled}</div>
                <div className="metric-label">Total Students</div>
                <div className="metric-trend positive">↗ +3.8%</div>
              </div>
              <div className="metric-card success">
                <div className="metric-value">{reportData.student.newEnrollments}</div>
                <div className="metric-label">New Enrollments</div>
                <div className="metric-subtitle">This Month</div>
              </div>
              <div className="metric-card warning">
                <div className="metric-value">{reportData.student.dropouts}</div>
                <div className="metric-label">Dropouts</div>
                <div className="metric-subtitle">This Month</div>
              </div>
              <div className="metric-card info">
                <div className="metric-value">{reportData.student.retentionRate}%</div>
                <div className="metric-label">Retention Rate</div>
                <div className="metric-trend positive">↗ +1.2%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="quick-insights">
        <h3>Quick Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Revenue Growth</h4>
              <p>Monthly revenue increased by 15% compared to last month</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">👥</div>
            <div className="insight-content">
              <h4>Student Engagement</h4>
              <p>Physics A batch shows highest attendance rate of 92%</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <h4>Action Required</h4>
              <p>Biology A batch needs attention - attendance dropped to 79%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
