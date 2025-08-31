import React, { useState } from "react";
import "./StudentManagement.css";

export default function StudentManagement() {
  const [students] = useState([
    {
      id: 1,
      name: "John Doe",
      image: "/images/student1.jpg",
      batch: "10th A",
      status: "active",
    },
    {
      id: 2,
      name: "Sarah Smith",
      image: "/images/student2.jpg",
      batch: "6th B",
      status: "active",
    },
    {
      id: 3,
      name: "Mike Johnson",
      image: "/images/student3.jpg",
      batch: "8th C",
      status: "inactive",
    },
    {
      id: 4,
      name: "Emily Davis",
      image: "/images/student4.jpg",
      batch: "9th A",
      status: "active",
    },
    {
      id: 5,
      name: "Alex Wilson",
      image: "/images/student5.jpg",
      batch: "5th B",
      status: "active",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewStudent = (studentId) => {
    alert(`Viewing details for student ID: ${studentId}`);
  };

  const handleEditStudent = (studentId) => {
    alert(`Editing student ID: ${studentId}`);
  };

  const handleToggleStatus = (studentId) => {
    alert(`Toggling status for student ID: ${studentId}`);
  };

  return (
    <div className="student-management">
      <div className="student-header">
        <h2>Student Management</h2>
        <button className="add-btn student-add-btn">
          <i className="fa-solid fa-user-plus"></i>
          <p>Add New Student</p>
        </button>
      </div>

      <div className="student-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search students by name or batch..."
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="filter-btns">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="filter">
            <i className="fa-solid fa-filter"></i>
            <p>Filter</p>
          </div>
        </div>
      </div>

      <div className="students-grid">
        {filteredStudents.map((student) => (
          <div key={student.id} className="student-card">
            <div className="student-card-header">
              <div className="student-avatar-large">
                <img src={student.image} alt="image" />
              </div>
              <div className="student-status"></div>
            </div>

            <div className="student-info-card">
              <h3>{student.name}</h3>
              <div className="info-item">
                <span className="info-icon">📚</span>
                <span>{student.batch}</span>
              </div>
            </div>

            <div className="student-actions">
              <button
                className="btn-action view"
                onClick={() => handleViewStudent(student.id)}
                title="View Details"
              >
                👁️
              </button>
              <button
                className="btn-action edit"
                onClick={() => handleEditStudent(student.id)}
                title="Edit Student"
              >
                ✏️
              </button>
              <button
                className="btn-action toggle"
                onClick={() => handleToggleStatus(student.id)}
                title="Toggle Status"
              >
                🔄
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">😔</div>
          <h3>No students found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
