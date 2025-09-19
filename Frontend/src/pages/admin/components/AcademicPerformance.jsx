import React, { useState, useEffect } from "react";
import "./AcademicPerformance.css";

export default function AcademicPerformance() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [performanceData, setPerformanceData] = useState({
    subject: "",
    score: "",
    maxScore: "100",
    grade: "",
    semester: "Current",
    year: new Date().getFullYear().toString(),
    examType: "Regular",
  });

  // Fetch all students
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/students/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerformance = async (e) => {
    e.preventDefault();

    if (
      !selectedStudent ||
      !performanceData.subject ||
      !performanceData.score
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/students/academic-performance/${selectedStudent.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(performanceData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert("Academic performance added successfully!");

        // Update the selected student's academic performance
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === selectedStudent.id
              ? { ...student, academicPerformance: data.academicPerformance }
              : student
          )
        );

        // Update selected student
        setSelectedStudent((prev) => ({
          ...prev,
          academicPerformance: data.academicPerformance,
        }));

        // Reset form
        setPerformanceData({
          subject: "",
          score: "",
          maxScore: "100",
          grade: "",
          semester: "Current",
          year: new Date().getFullYear().toString(),
          examType: "Regular",
        });

        setShowAddForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error adding performance:", error);
      alert("Failed to add academic performance");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateGrade = (score, maxScore = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C+";
    if (percentage >= 40) return "C";
    return "D";
  };

  const handleScoreChange = (value) => {
    const score = parseFloat(value);
    const maxScore = parseFloat(performanceData.maxScore);
    const grade = calculateGrade(score, maxScore);

    setPerformanceData((prev) => ({
      ...prev,
      score: value,
      grade: grade,
    }));
  };

  return (
    <div className="academic-performance-management">
      <div className="header">
        <h2>Academic Performance Management</h2>
        <p>Manage and track student academic performance</p>
      </div>

      <div className="content-grid">
        {/* Students List */}
        <div className="students-section">
          <div className="section-header">
            <h3>Students</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="students-list">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`student-item ${
                  selectedStudent?.id === student.id ? "selected" : ""
                }`}
                onClick={() => setSelectedStudent(student)}
              >
                <div className="student-avatar">
                  {student.profilePic ? (
                    <img src={student.profilePic} alt={student.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="student-info">
                  <h4>{student.name}</h4>
                  <p>
                    {student.class} • {student.email}
                  </p>
                  <span className="performance-status">
                    {student.academicPerformance?.subjects?.length || 0}{" "}
                    subjects recorded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Details and Performance */}
        <div className="performance-section">
          {selectedStudent ? (
            <>
              <div className="section-header">
                <h3>{selectedStudent.name}'s Academic Performance</h3>
                <button
                  className="add-btn"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Performance Data
                </button>
              </div>

              {/* Current Performance */}
              <div className="current-performance">
                {selectedStudent.academicPerformance?.subjects?.length > 0 ? (
                  <>
                    <div className="performance-summary">
                      <div className="summary-card">
                        <h4>Overall Percentage</h4>
                        <span className="percentage">
                          {selectedStudent.academicPerformance.overallPercentage?.toFixed(
                            1
                          ) || 0}
                          %
                        </span>
                      </div>
                      <div className="summary-card">
                        <h4>Overall GPA</h4>
                        <span className="gpa">
                          {selectedStudent.academicPerformance.overallGPA?.toFixed(
                            1
                          ) || 0}
                        </span>
                      </div>
                      <div className="summary-card">
                        <h4>Subjects</h4>
                        <span className="count">
                          {selectedStudent.academicPerformance.subjects.length}
                        </span>
                      </div>
                    </div>

                    <div className="subjects-list">
                      <h4>Subject Performance</h4>
                      {selectedStudent.academicPerformance.subjects.map(
                        (subject, index) => (
                          <div key={index} className="subject-item">
                            <div className="subject-info">
                              <h5>{subject.name}</h5>
                              <p>
                                {subject.semester} {subject.year} •{" "}
                                {subject.examType}
                              </p>
                            </div>
                            <div className="subject-score">
                              <span className="score">
                                {subject.score}/{subject.maxScore}
                              </span>
                              <span
                                className={`grade grade-${subject.grade
                                  ?.replace("+", "plus")
                                  ?.toLowerCase()}`}
                              >
                                {subject.grade}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <div className="no-performance">
                    <div className="no-performance-icon">📊</div>
                    <h4>No Academic Performance Data</h4>
                    <p>
                      Add performance data to track this student's academic
                      progress
                    </p>
                  </div>
                )}
              </div>

              {/* Add Performance Form */}
              {showAddForm && (
                <div className="add-form-overlay">
                  <div className="add-form">
                    <div className="form-header">
                      <h3>Add Academic Performance</h3>
                      <button
                        className="close-btn"
                        onClick={() => setShowAddForm(false)}
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleAddPerformance}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Subject *</label>
                          <input
                            type="text"
                            value={performanceData.subject}
                            onChange={(e) =>
                              setPerformanceData((prev) => ({
                                ...prev,
                                subject: e.target.value,
                              }))
                            }
                            placeholder="e.g., Mathematics"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Exam Type</label>
                          <select
                            value={performanceData.examType}
                            onChange={(e) =>
                              setPerformanceData((prev) => ({
                                ...prev,
                                examType: e.target.value,
                              }))
                            }
                          >
                            <option value="Regular">Regular</option>
                            <option value="Midterm">Midterm</option>
                            <option value="Final">Final</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Assignment">Assignment</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Score *</label>
                          <input
                            type="number"
                            value={performanceData.score}
                            onChange={(e) => handleScoreChange(e.target.value)}
                            min="0"
                            max={performanceData.maxScore}
                            placeholder="e.g., 85"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Max Score</label>
                          <input
                            type="number"
                            value={performanceData.maxScore}
                            onChange={(e) =>
                              setPerformanceData((prev) => ({
                                ...prev,
                                maxScore: e.target.value,
                              }))
                            }
                            min="1"
                            placeholder="e.g., 100"
                          />
                        </div>
                        <div className="form-group">
                          <label>Grade</label>
                          <input
                            type="text"
                            value={performanceData.grade}
                            onChange={(e) =>
                              setPerformanceData((prev) => ({
                                ...prev,
                                grade: e.target.value,
                              }))
                            }
                            placeholder="Auto-calculated"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Semester</label>
                          <select
                            value={performanceData.semester}
                            onChange={(e) =>
                              setPerformanceData((prev) => ({
                                ...prev,
                                semester: e.target.value,
                              }))
                            }
                          >
                            <option value="Current">Current</option>
                            <option value="Semester 1">Semester 1</option>
                            <option value="Semester 2">Semester 2</option>
                            <option value="Q1">Quarter 1</option>
                            <option value="Q2">Quarter 2</option>
                            <option value="Q3">Quarter 3</option>
                            <option value="Q4">Quarter 4</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Year</label>
                          <input
                            type="text"
                            value={performanceData.year}
                            onChange={(e) =>
                              setPerformanceData((prev) => ({
                                ...prev,
                                year: e.target.value,
                              }))
                            }
                            placeholder="e.g., 2025"
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" disabled={loading}>
                          {loading ? "Adding..." : "Add Performance Data"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-student-selected">
              <div className="no-student-icon">👥</div>
              <h3>Select a Student</h3>
              <p>
                Choose a student from the list to view and manage their academic
                performance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
