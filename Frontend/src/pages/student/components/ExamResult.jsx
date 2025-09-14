import React, { useState } from "react";
import { Trophy, Award, FileText, Target, ChevronDown } from "lucide-react";
import "./ExamResult.css";

export default function ExamResult() {
  const [selectedFilter, setSelectedFilter] = useState("All Results");

  // Sample exam data
  const performanceStats = [
    {
      title: "Overall Performance",
      value: "89%",
      subtitle: "Excellent performance",
      icon: Trophy,
      color: "blue",
    },
    {
      title: "Average Grade",
      value: "A",
      subtitle: "90% average",
      icon: Award,
      color: "green",
    },
    {
      title: "Exams Completed",
      value: "5",
      subtitle: "1 upcoming exam",
      icon: FileText,
      color: "orange",
    },
    {
      title: "Total Marks",
      value: "335/375",
      subtitle: "Marks obtained",
      icon: Target,
      color: "teal",
    },
  ];

  const subjectPerformance = [
    { subject: "Mathematics", percentage: 92, color: "#3b82f6" },
    { subject: "Physics", percentage: 88, color: "#3b82f6" },
    { subject: "Chemistry", percentage: 85, color: "#3b82f6" },
    { subject: "Computer Science", percentage: 94, color: "#3b82f6" },
    { subject: "English", percentage: 92, color: "#3b82f6" },
  ];

  const examResults = [
    {
      subject: "Mathematics",
      examType: "Mid-term",
      date: "Sep 05, 2024",
      marks: "92/100",
      percentage: "92%",
      grade: "A+",
      status: "Completed",
    },
    {
      subject: "Physics",
      examType: "Unit Test",
      date: "Sep 03, 2024",
      marks: "88/100",
      percentage: "88%",
      grade: "A",
      status: "Completed",
    },
    {
      subject: "Chemistry",
      examType: "Quiz",
      date: "Sep 01, 2024",
      marks: "85/100",
      percentage: "85%",
      grade: "A",
      status: "Completed",
    },
    {
      subject: "Computer Science",
      examType: "Project",
      date: "Aug 28, 2024",
      marks: "94/100",
      percentage: "94%",
      grade: "A+",
      status: "Completed",
    },
    {
      subject: "English",
      examType: "Essay",
      date: "Aug 25, 2024",
      marks: "92/100",
      percentage: "92%",
      grade: "A+",
      status: "Completed",
    },
    {
      subject: "Mathematics",
      examType: "Final Exam",
      date: "Sep 15, 2024",
      marks: "-",
      percentage: "-",
      grade: "-",
      status: "Upcoming",
    },
  ];

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A+":
        return "#10b981";
      case "A":
        return "#059669";
      case "B+":
        return "#f59e0b";
      case "B":
        return "#d97706";
      case "C":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#10b981";
      case "Upcoming":
        return "#f59e0b";
      case "Pending":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="exam-result">
      <div className="exam-header">
        <h2>Exam Results</h2>
        <p>Review your exam performance and results</p>
      </div>

      <div className="exam-perfor">
        {/* Subject-wise Performance Section */}
        <div className="performance-section">
          <div className="section-header">
            <h2>Subject-wise Performance</h2>
            <p>Track your performance across different subjects</p>
          </div>
          <div className="subjects-list">
            {subjectPerformance.map((subject, index) => (
              <div key={index} className="subject-item">
                <div className="subject-info">
                  <span className="subject-name">{subject.subject}</span>
                  <span className="subject-percentage">
                    {subject.percentage}%
                  </span>
                </div>
                <div className="exam-progress-bar">
                  <div
                    className="exam-progress-fill"
                    style={{
                      width: `${subject.percentage}%`,
                      backgroundColor: subject.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Stats Cards */}
        <div className="exam-perfor-stats-grid">
          {performanceStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className={`exam-stat-card ${stat.color}`}>
                <div className="exam-stat-header">
                  <span className="exam-stat-title">{stat.title}</span>
                  <IconComponent size={16} className="exam-stat-icon" />
                </div>
                <div className="exam-stat-value-section">
                  <h2 className="exam-stat-number">{stat.value}</h2>
                  <span className="exam-stat-subtitle">{stat.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Results Section */}
      <div className="results-section">
        <div className="results-header">
          <div className="results-title">
            <h2>Detailed Results</h2>
            <p>Complete breakdown of all your exam results</p>
          </div>
          <div className="results-filter">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All Results">All Results</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
        </div>

        {/* Results Table */}
        <div className="results-table">
          <div className="exam-table-header">
            <div className="table-cell">Subject</div>
            <div className="table-cell">Exam Type</div>
            <div className="table-cell">Date</div>
            <div className="table-cell">Marks</div>
            <div className="table-cell">Percentage</div>
            <div className="table-cell">Grade</div>
            <div className="table-cell">Status</div>
          </div>
          <div className="table-body">
            {examResults.map((result, index) => (
              <div key={index} className="exam-table-row">
                <div className="table-cell">
                  <span className="subject-cell">{result.subject}</span>
                </div>
                <div className="table-cell">
                  <span className="exam-type">{result.examType}</span>
                </div>
                <div className="table-cell">
                  <span className="date-cell">{result.date}</span>
                </div>
                <div className="table-cell">
                  <span className="marks-cell">{result.marks}</span>
                </div>
                <div className="table-cell">
                  <span className="percentage-cell">{result.percentage}</span>
                </div>
                <div className="table-cell">
                  <span
                    className="grade-cell"
                    style={{ color: getGradeColor(result.grade) }}
                  >
                    {result.grade}
                  </span>
                </div>
                <div className="table-cell">
                  <span
                    className={`status-badge ${result.status.toLowerCase()}`}
                    style={{
                      backgroundColor: `${getStatusColor(result.status)}15`,
                      color: getStatusColor(result.status),
                      border: `1px solid ${getStatusColor(result.status)}30`,
                    }}
                  >
                    {result.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
