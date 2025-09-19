import React, { useState, useEffect } from "react";
import "./ManualAddMark.css";

export default function ManualAddMark() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [marks, setMarks] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const subjects = [
    { id: "Mathematics", name: "Mathematics" },
    { id: "Physics", name: "Physics" },
    { id: "Chemistry", name: "Chemistry" },
    { id: "English", name: "English" },
    { id: "Biology", name: "Biology" },
    { id: "Computer Science", name: "Computer Science" },
  ];

  const exams = [
    { id: "midterm", name: "Mid-term Examination", maxMarks: 100 },
    { id: "final", name: "Final Examination", maxMarks: 100 },
    { id: "quiz1", name: "Quiz 1", maxMarks: 50 },
    { id: "quiz2", name: "Quiz 2", maxMarks: 50 },
    { id: "assignment1", name: "Assignment 1", maxMarks: 25 },
    { id: "assignment2", name: "Assignment 2", maxMarks: 25 },
    { id: "project", name: "Project Work", maxMarks: 100 },
    { id: "practical", name: "Practical Exam", maxMarks: 50 },
  ];

  // Fetch teacher's batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch students when batch and subject are selected
  useEffect(() => {
    if (selectedBatch && selectedSubject && selectedExam) {
      fetchStudentsAndMarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedSubject, selectedExam]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("Token");

      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:3000/teacher/batches", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setBatches(data.batches || []);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch batches");
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndMarks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("Token");

      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/teacher/marks?batchId=${selectedBatch}&subject=${selectedSubject}&examType=${selectedExam}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setStudents(data.marks || []);
        // Initialize marks state with existing marks
        const existingMarks = {};
        data.marks.forEach((student) => {
          if (student.currentMark !== null) {
            existingMarks[student.studentId] = student.currentMark;
          }
        });
        setMarks(existingMarks);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch students and marks");
      }
    } catch (err) {
      console.error("Error fetching students and marks:", err);
      setError("Failed to fetch students and marks");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkChange = (studentId, mark) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: mark,
    }));
  };

  const getSelectedExamDetails = () => {
    return exams.find((exam) => exam.id === selectedExam);
  };

  const handleSaveMarks = async () => {
    if (!selectedBatch || !selectedSubject || !selectedExam) {
      alert("Please select batch, subject, and exam first");
      return;
    }

    const examDetails = getSelectedExamDetails();
    const marksToSave = Object.entries(marks).filter(([, mark]) => mark !== "");

    if (marksToSave.length === 0) {
      alert("Please enter marks for at least one student");
      return;
    }

    // Validate marks
    const invalidMarks = marksToSave.filter(
      ([, mark]) =>
        mark !== "Absent" &&
        mark !== "absent" &&
        (mark < 0 || mark > examDetails.maxMarks)
    );

    if (invalidMarks.length > 0) {
      alert(`Marks should be between 0 and ${examDetails.maxMarks}`);
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("Token");

      if (!token) {
        alert("No authentication token found");
        return;
      }

      const marksData = marksToSave.map(([studentId, mark]) => ({
        studentId,
        mark,
      }));

      const response = await fetch("http://localhost:3000/teacher/marks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          subject: selectedSubject,
          examType: selectedExam,
          examName: examDetails.name,
          maxMarks: examDetails.maxMarks,
          marks: marksData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Marks saved successfully for ${marksToSave.length} students!`);
        // Refresh the data
        fetchStudentsAndMarks();
      } else {
        alert(data.message || "Failed to save marks");
      }
    } catch (err) {
      console.error("Error saving marks:", err);
      alert("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = (action) => {
    if (action === "clear") {
      setMarks({});
    } else if (action === "absent") {
      const newMarks = {};
      filteredStudents.forEach((student) => {
        newMarks[student.studentId] = "Absent";
      });
      setMarks(newMarks);
    }
  };

  if (loading && batches.length === 0) {
    return (
      <div className="manual-add-mark">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading batches...</p>
        </div>
      </div>
    );
  }

  if (error && batches.length === 0) {
    return (
      <div className="manual-add-mark">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load batches</h3>
          <p>{error}</p>
          <button onClick={fetchBatches} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-add-mark">
      <div className="page-header">
        <h2>Manual Add Marks</h2>
        <p>Add or update marks for students manually</p>
      </div>

      <div className="selection-section">
        <div className="selection-grid">
          <div className="form-group">
            <label>Select Batch *</label>
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setStudents([]);
                setMarks({});
              }}
              className="select-input"
              disabled={loading}
            >
              <option value="">Choose a batch...</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName} - {batch.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Subject *</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setStudents([]);
                setMarks({});
              }}
              className="select-input"
              disabled={loading}
            >
              <option value="">Choose a subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Exam/Assessment *</label>
            <select
              value={selectedExam}
              onChange={(e) => {
                setSelectedExam(e.target.value);
                setMarks({});
              }}
              className="select-input"
              disabled={loading}
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} (Max: {exam.maxMarks})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedBatch && selectedSubject && selectedExam && (
        <div className="marks-section">
          <div className="section-header">
            <div className="exam-info">
              <h3>{getSelectedExamDetails()?.name}</h3>
              <span className="max-marks">
                Maximum Marks: {getSelectedExamDetails()?.maxMarks}
              </span>
            </div>
            <div className="search-and-actions">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="bulk-actions">
                <button
                  className="bulk-btn clear-btn"
                  onClick={() => handleBulkAction("clear")}
                >
                  Clear All
                </button>
                <button
                  className="bulk-btn absent-btn"
                  onClick={() => handleBulkAction("absent")}
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          </div>

          <div className="students-grid">
            {loading && students.length === 0 ? (
              <div className="loading-students">
                <div className="loading-spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="no-students">
                <p>No students found for this selection</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.studentId} className="student-card">
                  <div className="student-info">
                    <div className="student-details">
                      <h4>{student.name}</h4>
                      <span className="roll-no">Roll No: {student.rollNo}</span>
                      <span className="student-class">
                        Class: {student.class}
                      </span>
                    </div>
                    {student.currentMark !== null && (
                      <div className="current-mark">
                        <span className="mark-label">Current:</span>
                        <span className="mark-value">
                          {student.currentMark}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mark-input-section">
                    <label>Enter Marks</label>
                    <div className="mark-input-group">
                      <input
                        type="number"
                        min="0"
                        max={getSelectedExamDetails()?.maxMarks}
                        value={marks[student.studentId] || ""}
                        onChange={(e) =>
                          handleMarkChange(student.studentId, e.target.value)
                        }
                        placeholder="0"
                        className="mark-input"
                      />
                      <button
                        className="absent-btn-small"
                        onClick={() =>
                          handleMarkChange(student.studentId, "Absent")
                        }
                      >
                        Absent
                      </button>
                    </div>
                    <div className="mark-status">
                      {marks[student.studentId] === "Absent" ? (
                        <span className="status absent">Marked as Absent</span>
                      ) : marks[student.studentId] ? (
                        <span className="status entered">
                          {marks[student.studentId]}/
                          {getSelectedExamDetails()?.maxMarks}
                        </span>
                      ) : (
                        <span className="status empty">Not entered</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="save-section">
            <div className="save-summary">
              <span>
                {Object.keys(marks).filter((key) => marks[key] !== "").length}{" "}
                of {filteredStudents.length} students have marks entered
              </span>
            </div>
            <button
              className="save-btn"
              onClick={handleSaveMarks}
              disabled={saving}
            >
              {saving ? "💾 Saving..." : "💾 Save All Marks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
