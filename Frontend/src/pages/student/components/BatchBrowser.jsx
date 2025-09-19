import React, { useState, useEffect } from "react";
import "./BatchBrowser.css";

export default function BatchBrowser() {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchAvailableBatches(),
      fetchMyBatches(),
      fetchMyRequests(),
    ]);
  };

  const fetchAvailableBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("Token");

      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/student/available-batches",
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
        setAvailableBatches(data.batches || []);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch available batches");
      }
    } catch (err) {
      console.error("Error fetching available batches:", err);
      setError("Failed to fetch available batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBatches = async () => {
    try {
      const token = localStorage.getItem("Token");

      if (!token) return;

      const response = await fetch("http://localhost:3000/student/my-batches", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setMyBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Error fetching my batches:", err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem("Token");

      if (!token) return;

      const response = await fetch(
        "http://localhost:3000/student/batch-requests",
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
        setMyRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching my requests:", err);
    }
  };

  const handleJoinRequest = async () => {
    if (!selectedBatch) return;

    try {
      const token = localStorage.getItem("Token");

      if (!token) {
        alert("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:3000/student/join-batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          message: joinMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Join request sent successfully!");
        setShowJoinModal(false);
        setSelectedBatch(null);
        setJoinMessage("");
        // Refresh data
        fetchData();
      } else {
        alert(data.message || "Failed to send join request");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
      alert("Failed to send join request");
    }
  };

  const getScheduleText = (schedule) => {
    if (!schedule || !schedule.days || schedule.days.length === 0) {
      return "Schedule not set";
    }

    const daysText = schedule.days.join(", ");
    const timeText =
      schedule.startTime && schedule.endTime
        ? `${schedule.startTime} - ${schedule.endTime}`
        : "";

    return `${daysText} ${timeText}`.trim();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && availableBatches.length === 0 && myBatches.length === 0) {
    return (
      <div className="batch-browser">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-browser">
      <div className="page-header">
        <h2>Batch Management</h2>
        <p>Browse available batches and manage your enrollments</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "available" ? "active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          Available Batches ({availableBatches.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "my-batches" ? "active" : ""}`}
          onClick={() => setActiveTab("my-batches")}
        >
          My Batches ({myBatches.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          My Requests ({myRequests.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "available" && (
          <div className="available-batches">
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchAvailableBatches} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {availableBatches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No Available Batches</h3>
                <p>There are currently no batches available for enrollment.</p>
              </div>
            ) : (
              <div className="batches-grid">
                {availableBatches.map((batch) => (
                  <div key={batch.id} className="batch-card">
                    <div className="batch-header">
                      <h3>{batch.batchName}</h3>
                      <span className="subject-tag">{batch.subject}</span>
                    </div>

                    <div className="batch-details">
                      <div className="detail-item">
                        <span className="label">Teacher:</span>
                        <span className="value">{batch.teacher.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Organization:</span>
                        <span className="value">
                          {batch.teacher.organization}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Schedule:</span>
                        <span className="value">
                          {getScheduleText(batch.schedule)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Students:</span>
                        <span className="value">{batch.studentsCount}</span>
                      </div>
                    </div>

                    <button
                      className="join-btn"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setShowJoinModal(true);
                      }}
                    >
                      Request to Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-batches" && (
          <div className="my-batches">
            {myBatches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎓</div>
                <h3>No Enrolled Batches</h3>
                <p>
                  You haven't joined any batches yet. Browse available batches
                  to get started.
                </p>
              </div>
            ) : (
              <div className="batches-grid">
                {myBatches.map((batch) => (
                  <div key={batch.id} className="batch-card enrolled">
                    <div className="batch-header">
                      <h3>{batch.batchName}</h3>
                      <span className="subject-tag">{batch.subject}</span>
                      <span className="enrolled-badge">Enrolled</span>
                    </div>

                    <div className="batch-details">
                      <div className="detail-item">
                        <span className="label">Teacher:</span>
                        <span className="value">{batch.teacher.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Schedule:</span>
                        <span className="value">
                          {getScheduleText(batch.schedule)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Students:</span>
                        <span className="value">{batch.studentsCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="my-requests">
            {myRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No Join Requests</h3>
                <p>You haven't made any batch join requests yet.</p>
              </div>
            ) : (
              <div className="requests-list">
                {myRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h3>{request.batchName}</h3>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(request.status),
                        }}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="request-details">
                      <div className="detail-item">
                        <span className="label">Subject:</span>
                        <span className="value">{request.subject}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Teacher:</span>
                        <span className="value">{request.teacher.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Request Date:</span>
                        <span className="value">
                          {formatDate(request.requestDate)}
                        </span>
                      </div>
                      {request.message && (
                        <div className="detail-item">
                          <span className="label">Your Message:</span>
                          <span className="value">{request.message}</span>
                        </div>
                      )}
                      {request.responseMessage && (
                        <div className="detail-item">
                          <span className="label">Teacher's Response:</span>
                          <span className="value">
                            {request.responseMessage}
                          </span>
                        </div>
                      )}
                      {request.responseDate && (
                        <div className="detail-item">
                          <span className="label">Response Date:</span>
                          <span className="value">
                            {formatDate(request.responseDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request to Join Batch</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowJoinModal(false);
                  setSelectedBatch(null);
                  setJoinMessage("");
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="batch-summary">
                <h4>{selectedBatch.batchName}</h4>
                <p>
                  <strong>Subject:</strong> {selectedBatch.subject}
                </p>
                <p>
                  <strong>Teacher:</strong> {selectedBatch.teacher.name}
                </p>
                <p>
                  <strong>Schedule:</strong>{" "}
                  {getScheduleText(selectedBatch.schedule)}
                </p>
              </div>

              <div className="message-section">
                <label htmlFor="joinMessage">Message (Optional):</label>
                <textarea
                  id="joinMessage"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Write a message to the teacher explaining why you want to join this batch..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowJoinModal(false);
                  setSelectedBatch(null);
                  setJoinMessage("");
                }}
              >
                Cancel
              </button>
              <button className="submit-btn" onClick={handleJoinRequest}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
