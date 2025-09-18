import React, { useState, useEffect } from "react";
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
  BookOpen,
  SquarePen,
} from "lucide-react";
import "./Student-Profile.css";

export default function StudentProfile() {
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("Token");

    if (!token) {
      setError("No token found. Please login again.");
      setIsLoading(false);
      return;
    }

    fetch("https://edu-manage-backend.onrender.com/student/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStudentData(data.student);
          console.log(data.student);
        } else {
          setError(data.message || "Failed to fetch profile");
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError("Something went wrong while fetching profile.");
      })
      .finally(() => {
        setTimeout(() => {
          setIsLoading(false);
        }, 2000)
      })
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="student-profile-page">
        <div className="profile-body">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-profile-page">
        <div className="profile-body">
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-profile-page">
      <div className="profile-body">
        {/* Main Profile Container */}
        <div className="main-profile-container">
          {/* Top Section with Photo and Basic Info */}
          <div className="top-section">
            <h1>Student Profile</h1>
            <p>Complete student information and academic details</p>
          </div>
          <div className="profile-grid">
            <div className="basic-info-section">
              <div className="profile-photo-section">
                <img
                  src={studentData.photo || "/images/student-1-profile.png"}
                  alt={studentData.name}
                  className="profile-photo-new"
                />
              </div>
              <div className="user-details">
                <span className="name-status">
                  <h2 className="student-name">{studentData.name}</h2>
                  <p className="status-badge-new">{studentData.status || "Active Student"}</p>
                </span>
                <div className="detail-item">
                  <Calendar size={16} color="#6b7280" />
                  <span style={{ color: "#6b7280" }}>
                    Joined: {formatDate(studentData.dateOfJoining)}
                  </span>
                </div>
              </div>
              <div className="profile-edit-btn">
                <button>
                  <span className="profile-edit-icon">
                    <SquarePen />
                  </span>
                  <p className="profile-edit-text">Edit Profile</p>
                </button>
              </div>
            </div>
            {/* Academic Performance Section */}
            <div className="academic-performance-section">
              <div className="performance-body">
                <div className="performance-header">
                  <BookOpen size={20} /> <h3>Academic Performance</h3>
                </div>
                <div className="performance-grid">
                  <div className="subject-performance">
                    <div className="subject-info">
                      <span className="subject-name">Mathematics</span>
                      <span className="grade-badge grade-a-plus">A+</span>
                    </div>
                    <div className="sub-progress-bar">
                      <div
                        className="sub-progress-fill"
                        style={{ width: "95%" }}
                      ></div>
                    </div>
                    <span className="percentage">95%</span>
                  </div>
                  <div className="subject-performance">
                    <div className="subject-info">
                      <span className="subject-name">Science</span>
                      <span className="grade-badge grade-a">A</span>
                    </div>
                    <div className="sub-progress-bar">
                      <div
                        className="sub-progress-fill"
                        style={{ width: "88%" }}
                      ></div>
                    </div>
                    <span className="percentage">88%</span>
                  </div>
                  <div className="subject-performance">
                    <div className="subject-info">
                      <span className="subject-name">English</span>
                      <span className="grade-badge grade-a">A</span>
                    </div>
                    <div className="sub-progress-bar">
                      <div
                        className="sub-progress-fill"
                        style={{ width: "92%" }}
                      ></div>
                    </div>
                    <span className="percentage">92%</span>
                  </div>
                  <div className="subject-performance">
                    <div className="subject-info">
                      <span className="subject-name">Social Studies</span>
                      <span className="grade-badge grade-b-plus">B+</span>
                    </div>
                    <div className="sub-progress-bar orange">
                      <div
                        className="sub-progress-fill orange"
                        style={{ width: "82%" }}
                      ></div>
                    </div>
                    <span className="percentage">82%</span>
                  </div>
                  <div className="subject-performance">
                    <div className="subject-info">
                      <span className="subject-name">Hindi</span>
                      <span className="grade-badge grade-a">A</span>
                    </div>
                    <div className="sub-progress-bar">
                      <div
                        className="sub-progress-fill"
                        style={{ width: "89%" }}
                      ></div>
                    </div>
                    <span className="percentage">89%</span>
                  </div>
                  <div className="subject-performance">
                    <div className="subject-info">
                      <span className="subject-name">Overall GPA</span>
                      <span className="grade-badge grade-a">A</span>
                    </div>
                    <div className="sub-progress-bar blue">
                      <div
                        className="sub-progress-fill blue"
                        style={{ width: "89%" }}
                      ></div>
                    </div>
                    <span className="percentage">8.9/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Information Cards Grid */}
          <div className="info-cards-container">
            {/* Personal Information Card */}
            <div className="info-card-new">
              <div className="card-header-new">
                <User size={25} className="info-card-icon" />
                <h3>Personal Information</h3>
              </div>
              <div className="card-content-new">
                <div className="card-info-item">
                  <span className="label">Full Name</span>
                  <span className="value">{studentData.name}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Blood Group</span>
                  <span className="value">{studentData.bloodGroup}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Aadhaar Number</span>
                  <span className="value">
                    {studentData.aadharNumber}
                    <span className="verified-badge">Verified</span>
                  </span>
                </div>
                <div className="card-info-item">
                  <span className="label">Email</span>
                  <span className="value email-value">
                    <Mail size={14} /> {studentData.email}
                  </span>
                </div>
              </div>
            </div>
            {/* Academic Information Card */}
            <div className="info-card-new">
              <div className="card-header-new">
                <GraduationCap size={25} className="info-card-icon" />
                <h3>Academic Information</h3>
              </div>
              <div className="card-content-new">
                <div className="card-info-item">
                  <span className="label">Current School</span>
                  <span className="value">{studentData.schoolName}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Current Class</span>
                  <span className="value">{studentData.class}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Last School Attended</span>
                  <span className="value">
                    {studentData.lastSchoolAttended}
                  </span>
                </div>
                <div className="card-info-item">
                  <span className="label">Date of Joining</span>
                  <span className="value">
                    <Calendar size={14} />
                    {formatDate(studentData.dateOfJoining)}
                  </span>
                </div>
              </div>
            </div>
            {/* Family Information Card */}
            <div className="info-card-new">
              <div className="card-header-new">
                <Users size={25} className="info-card-icon" />
                <h3>Family Information</h3>
              </div>
              <div className="card-content-new">
                <div className="card-info-item">
                  <span className="label">Father's Name</span>
                  <span className="value">{studentData.fatherName}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Mother's Name</span>
                  <span className="value">{studentData.motherName}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Guardian Contact</span>
                  <span className="value phone-value">
                    <Phone size={14} /> {studentData.guardianPhone}
                  </span>
                </div>
                <div className="card-info-item">
                  <span className="label">Address</span>
                  <span className="value address-value">
                    <MapPin size={14} /> {studentData.completeAddress}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
