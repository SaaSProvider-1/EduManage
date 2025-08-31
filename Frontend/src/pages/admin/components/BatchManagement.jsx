import React, { useState } from "react";
import "./BatchManagement.css";

export default function BatchManagement() {
  const [batches] = useState([
    {
      id: 1,
      name: "Physics A",
      subject: "Physics",
      teacher: "Dr. Rajesh Kumar",
      students: 25,
      capacity: 30,
      startDate: "2025-01-15",
      endDate: "2025-06-15",
      schedule: "Mon, Wed, Fri - 10:00 AM",
      fees: 5000,
      status: "active",
    },
    {
      id: 2,
      name: "Chemistry B",
      subject: "Chemistry",
      teacher: "Prof. Priya Sharma",
      students: 18,
      capacity: 25,
      startDate: "2025-02-01",
      endDate: "2025-07-01",
      schedule: "Tue, Thu, Sat - 2:00 PM",
      fees: 4500,
      status: "active",
    },
    {
      id: 3,
      name: "Math Advanced",
      subject: "Mathematics",
      teacher: "Mr. Amit Patel",
      students: 22,
      capacity: 28,
      startDate: "2025-01-20",
      endDate: "2025-06-20",
      schedule: "Mon, Wed, Fri - 4:00 PM",
      fees: 6000,
      status: "active",
    },
    {
      id: 4,
      name: "Biology A",
      subject: "Biology",
      teacher: "Dr. Sunita Mehta",
      students: 15,
      capacity: 20,
      startDate: "2025-03-01",
      endDate: "2025-08-01",
      schedule: "Tue, Thu, Sat - 10:00 AM",
      fees: 4000,
      status: "upcoming",
    },
    {
      id: 5,
      name: "Physics Basic",
      subject: "Physics",
      teacher: "Dr. Rajesh Kumar",
      students: 30,
      capacity: 30,
      startDate: "2024-09-01",
      endDate: "2025-02-01",
      schedule: "Mon, Wed, Fri - 8:00 AM",
      fees: 4000,
      status: "completed",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || batch.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10b981";
      case "upcoming":
        return "#f59e0b";
      case "completed":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getCapacityPercentage = (students, capacity) => {
    return (students / capacity) * 100;
  };

  const handleViewBatch = (batchId) => {
    alert(`Viewing details for batch ID: ${batchId}`);
  };

  const handleEditBatch = (batchId) => {
    alert(`Editing batch ID: ${batchId}`);
  };

  const handleManageStudents = (batchId) => {
    alert(`Managing students for batch ID: ${batchId}`);
  };

  return (
    <div className="batch-management">
      <div className="batch-header">
        <h2>Batch Management</h2>
        <button className="create-btn create-btn-primary">
          <i class="fa-solid fa-plus"></i>
          <p>Create New Batch</p>
        </button>
      </div>

      <div className="batch-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search batches by name, subject, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="batch-stats">
        <div className="stat-item">
          <span className="stat-number">
            {batches.filter((b) => b.status === "active").length}
          </span>
          <span className="stat-label">Active Batches</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {batches.filter((b) => b.status === "upcoming").length}
          </span>
          <span className="stat-label">Upcoming</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {batches.reduce((sum, b) => sum + b.students, 0)}
          </span>
          <span className="stat-label">Total Students</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {batches.reduce((sum, b) => sum + b.capacity, 0)}
          </span>
          <span className="stat-label">Total Capacity</span>
        </div>
      </div>

      <div className="batches-grid">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="batch-card">
            <div className="batch-card-header">
              <h3>{batch.name}</h3>
              <span
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(batch.status) }}
              >
                {batch.status}
              </span>
            </div>

            <div className="subject-info">
              <span
                className="subject-badge"
                style={{
                  backgroundColor: getStatusColor(batch.status) + "20",
                  color: getStatusColor(batch.status),
                }}
              >
                {batch.subject}
              </span>
            </div>

            <div className="batch-details">
              <div className="detail-item">
                <span className="detail-icon">👨‍🏫</span>
                <span>{batch.teacher}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <span>{batch.schedule}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">💰</span>
                <span>₹{batch.fees.toLocaleString()}/month</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📆</span>
                <span>
                  {batch.startDate} to {batch.endDate}
                </span>
              </div>
            </div>

            <div className="capacity-section">
              <div className="capacity-header">
                <span>Capacity</span>
                <span className="capacity-numbers">
                  {batch.students}/{batch.capacity}
                </span>
              </div>
              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${getCapacityPercentage(
                      batch.students,
                      batch.capacity
                    )}%`,
                    backgroundColor:
                      getCapacityPercentage(batch.students, batch.capacity) > 80
                        ? "#ef4444"
                        : getCapacityPercentage(
                            batch.students,
                            batch.capacity
                          ) > 60
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                ></div>
              </div>
              <div className="capacity-percentage">
                {Math.round(
                  getCapacityPercentage(batch.students, batch.capacity)
                )}
                % filled
              </div>
            </div>

            <div className="batch-actions">
              <button
                className="btn-action view"
                onClick={() => handleViewBatch(batch.id)}
                title="View Details"
              >
                👁️
              </button>
              <button
                className="btn-action edit"
                onClick={() => handleEditBatch(batch.id)}
                title="Edit Batch"
              >
                ✏️
              </button>
              <button
                className="btn-action students"
                onClick={() => handleManageStudents(batch.id)}
                title="Manage Students"
              >
                👥
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">📚</div>
          <h3>No batches found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
