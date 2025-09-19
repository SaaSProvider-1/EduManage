import React, { useState, useEffect } from "react";
import "./BatchManagement.css";

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [viewMode, setViewMode] = useState("overview"); // overview, students, attendance
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batchName: "",
    subject: "",
    schedule: {
      days: [],
      startTime: "",
      endTime: "",
    },
  });

  // Fetch batches from backend
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("Token");
      const response = await fetch("http://localhost:3000/teacher/batches", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setBatches(data.batches || []);
      } else {
        console.error("Failed to fetch batches:", data.message);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setViewMode("overview");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10b981";
      case "inactive":
        return "#ef4444";
      case "completed":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("Token");
      const response = await fetch("http://localhost:3000/teacher/batches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBatch),
      });

      const data = await response.json();
      if (data.success) {
        setBatches([...batches, data.batch]);
        setShowCreateModal(false);
        setNewBatch({
          batchName: "",
          subject: "",
          schedule: {
            days: [],
            startTime: "",
            endTime: "",
          },
        });
        alert("Batch created successfully!");
      } else {
        alert("Failed to create batch: " + data.message);
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      alert("Error creating batch");
    }
  };

  const handleDayToggle = (day) => {
    const updatedDays = newBatch.schedule.days.includes(day)
      ? newBatch.schedule.days.filter((d) => d !== day)
      : [...newBatch.schedule.days, day];

    setNewBatch({
      ...newBatch,
      schedule: {
        ...newBatch.schedule,
        days: updatedDays,
      },
    });
  };

  const formatSchedule = (batch) => {
    if (
      !batch.schedule ||
      !batch.schedule.days ||
      batch.schedule.days.length === 0
    ) {
      return "No schedule set";
    }

    const daysStr = batch.schedule.days.join(", ");
    const timeStr =
      batch.schedule.startTime && batch.schedule.endTime
        ? `${batch.schedule.startTime} - ${batch.schedule.endTime}`
        : "";

    return `${daysStr}${timeStr ? ` (${timeStr})` : ""}`;
  };

  if (loading) {
    return (
      <div className="batch-management">
        <div className="loading-spinner">Loading batches...</div>
      </div>
    );
  }

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
            <div className="header-actions">
              <span className="batch-count">{batches.length} batches</span>
              <button
                className="create-batch-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + Create Batch
              </button>
            </div>
          </div>

          <div className="batch-list">
            {batches.length === 0 ? (
              <div className="no-batches">
                <p>No batches found</p>
                <button
                  className="create-first-batch-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create your first batch
                </button>
              </div>
            ) : (
              batches.map((batch) => (
                <div
                  key={batch._id}
                  className={`batch-item ${
                    selectedBatch?._id === batch._id ? "selected" : ""
                  }`}
                  onClick={() => handleBatchSelect(batch)}
                >
                  <div className="batch-item-header">
                    <h4>{batch.batchName}</h4>
                    <div
                      className="batch-status"
                      style={{ backgroundColor: getStatusColor(batch.status) }}
                    >
                      {batch.status}
                    </div>
                  </div>
                  <div className="batch-item-details">
                    <span>👥 {batch.students?.length || 0} students</span>
                    <span>� {batch.subject}</span>
                  </div>
                  <div className="batch-schedule">
                    📅 {formatSchedule(batch)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="batch-details">
          {selectedBatch ? (
            <>
              <div className="batch-details-header">
                <div className="batch-info">
                  <h2>{selectedBatch.batchName}</h2>
                  <div className="batch-meta">
                    <span className="meta-item">
                      📚 {selectedBatch.subject}
                    </span>
                    <span className="meta-item">
                      👥 {selectedBatch.students?.length || 0} students
                    </span>
                    <span className="meta-item">
                      � {formatSchedule(selectedBatch)}
                    </span>
                  </div>
                </div>

                <div className="view-tabs">
                  <button
                    className={`tab-btn ${
                      viewMode === "overview" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`tab-btn ${
                      viewMode === "students" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("students")}
                  >
                    Students
                  </button>
                  <button
                    className={`tab-btn ${
                      viewMode === "attendance" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("attendance")}
                  >
                    Attendance
                  </button>
                </div>
              </div>

              <div className="batch-content">
                {viewMode === "overview" && (
                  <div className="overview-section">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                          <h3>{selectedBatch.students?.length || 0}</h3>
                          <p>Total Students</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                          <h3>-</h3>
                          <p>Average Attendance</p>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-info">
                          <h3>-</h3>
                          <p>Average Score</p>
                        </div>
                      </div>
                    </div>

                    <div className="quick-actions">
                      <h3>Quick Actions</h3>
                      <div className="actions-grid">
                        <button className="action-btn">
                          📝 Take Attendance
                        </button>
                        <button className="action-btn">
                          📋 Create Assignment
                        </button>
                        <button className="action-btn">📊 View Reports</button>
                        <button className="action-btn">💬 Send Message</button>
                      </div>
                    </div>

                    <div className="recent-activities">
                      <h3>Recent Activities</h3>
                      <div className="activity-list">
                        <div className="activity-item">
                          <span className="activity-icon">�</span>
                          <span className="activity-text">
                            Batch created on{" "}
                            {new Date(
                              selectedBatch.createdAt
                            ).toLocaleDateString()}
                          </span>
                          <span className="activity-time">
                            {new Date(
                              selectedBatch.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === "students" && (
                  <div className="students-section">
                    <div className="students-header">
                      <h3>Students List</h3>
                      <button className="add-student-btn">+ Add Student</button>
                    </div>
                    {selectedBatch.students &&
                    selectedBatch.students.length > 0 ? (
                      <div className="students-grid">
                        {selectedBatch.students.map((student, index) => (
                          <div
                            key={student._id || index}
                            className="student-card"
                          >
                            <div className="student-avatar">👤</div>
                            <div className="student-info">
                              <h4>{student.name || `Student ${index + 1}`}</h4>
                              <p>Email: {student.contact?.email || "N/A"}</p>
                              <p>Class: {student.class || "N/A"}</p>
                            </div>
                            <div className="student-actions">
                              <button className="action-icon">👁️</button>
                              <button className="action-icon">✏️</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-students">
                        <p>No students enrolled in this batch yet.</p>
                        <button className="add-student-btn">
                          + Add Students
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === "attendance" && (
                  <div className="attendance-section">
                    <div className="attendance-header">
                      <h3>Attendance Management</h3>
                      <div className="attendance-controls">
                        <input
                          type="date"
                          className="date-input"
                          defaultValue={new Date().toISOString().split("T")[0]}
                        />
                        <button className="mark-attendance-btn">
                          Mark Attendance
                        </button>
                      </div>
                    </div>
                    <div className="attendance-summary">
                      <div className="summary-card">
                        <h4>Today's Attendance</h4>
                        <div className="attendance-stats">
                          <span className="present">Present: -</span>
                          <span className="absent">Absent: -</span>
                          <span className="percentage">-%</span>
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
              <p>
                Choose a batch from the left sidebar to manage students and view
                analytics
              </p>
              {batches.length === 0 && (
                <button
                  className="create-batch-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create your first batch
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-batch-modal">
            <div className="modal-header">
              <h3>Create New Batch</h3>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="create-batch-form">
              <div className="form-group">
                <label>Batch Name *</label>
                <input
                  type="text"
                  value={newBatch.batchName}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, batchName: e.target.value })
                  }
                  placeholder="e.g., Mathematics Grade 10A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={newBatch.subject}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, subject: e.target.value })
                  }
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>

              <div className="form-group">
                <label>Days of Week</label>
                <div className="days-selection">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <label key={day} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={newBatch.schedule.days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                      <span>{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newBatch.schedule.startTime}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        schedule: {
                          ...newBatch.schedule,
                          startTime: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newBatch.schedule.endTime}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        schedule: {
                          ...newBatch.schedule,
                          endTime: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
