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

    fetch("http://localhost:3000/student/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Full API response:", data);
        if (data.success) {
          console.log("Student data received:", data.student);
          setStudentData(data.student);
        } else {
          console.error("API returned error:", data.message);
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

  const getGradeBadgeClass = (grade) => {
    if (!grade) return 'grade-badge';
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper.includes('A+')) return 'grade-badge grade-a-plus';
    if (gradeUpper.includes('A')) return 'grade-badge grade-a';
    if (gradeUpper.includes('B+')) return 'grade-badge grade-b-plus';
    if (gradeUpper.includes('B')) return 'grade-badge grade-b';
    if (gradeUpper.includes('C')) return 'grade-badge grade-c';
    return 'grade-badge';
  };

  const getProgressBarClass = (score) => {
    if (score >= 90) return 'sub-progress-bar';
    if (score >= 80) return 'sub-progress-bar blue';
    if (score >= 70) return 'sub-progress-bar orange';
    return 'sub-progress-bar red';
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
                  <h2 className="student-name">{studentData?.name || 'N/A'}</h2>
                  <p className="status-badge-new">{studentData?.status || "Active Student"}</p>
                </span>
                <div className="detail-item">
                  <Calendar size={16} color="#6b7280" />
                  <span style={{ color: "#6b7280" }}>
                    Joined: {studentData?.dateOfJoining ? formatDate(studentData.dateOfJoining) : 'N/A'}
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
                  {studentData?.academicPerformance?.subjects?.map((subject, index) => (
                    <div key={index} className="subject-performance">
                      <div className="subject-info">
                        <span className="subject-name">{subject.name || 'N/A'}</span>
                        <span className={getGradeBadgeClass(subject.grade)}>{subject.grade || 'N/A'}</span>
                      </div>
                      <div className={getProgressBarClass(subject.score)}>
                        <div
                          className="sub-progress-fill"
                          style={{ width: `${subject.score || 0}%` }}
                        ></div>
                      </div>
                      <span className="percentage">{subject.score || 0}%</span>
                    </div>
                  )) || (
                    <div className="no-performance-data">
                      <p>No academic performance data available</p>
                    </div>
                  )}
                  
                  {/* Overall GPA Section */}
                  {studentData?.academicPerformance?.overallGPA && (
                    <div className="subject-performance">
                      <div className="subject-info">
                        <span className="subject-name">Overall GPA</span>
                        <span className="grade-badge grade-a">
                          {studentData.academicPerformance.overallGPA >= 8 ? 'A' : 
                           studentData.academicPerformance.overallGPA >= 7 ? 'B' : 
                           studentData.academicPerformance.overallGPA >= 6 ? 'C' : 'D'}
                        </span>
                      </div>
                      <div className="sub-progress-bar blue">
                        <div
                          className="sub-progress-fill blue"
                          style={{ width: `${(studentData.academicPerformance.overallGPA / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="percentage">{studentData.academicPerformance.overallGPA}/10</span>
                    </div>
                  )}
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
                  <span className="value">{studentData?.name || 'N/A'}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Blood Group</span>
                  <span className="value">{studentData?.bloodGroup || 'N/A'}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Aadhaar Number</span>
                  <span className="value">
                    {studentData?.aadharNumber || 'N/A'}
                    {studentData?.aadharNumber && <span className="verified-badge">Verified</span>}
                  </span>
                </div>
                <div className="card-info-item">
                  <span className="label">Email</span>
                  <span className="value email-value">
                    <Mail size={14} /> {studentData?.email || 'N/A'}
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
                  <span className="value">{studentData?.schoolName || 'N/A'}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Current Class</span>
                  <span className="value">{studentData?.class || 'N/A'}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Last School Attended</span>
                  <span className="value">
                    {studentData?.lastSchoolAttended || 'N/A'}
                  </span>
                </div>
                <div className="card-info-item">
                  <span className="label">Date of Joining</span>
                  <span className="value">
                    <Calendar size={14} />
                    {studentData?.dateOfJoining ? formatDate(studentData.dateOfJoining) : 'N/A'}
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
                  <span className="value">{studentData?.fatherName || 'N/A'}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Mother's Name</span>
                  <span className="value">{studentData?.motherName || 'N/A'}</span>
                </div>
                <div className="card-info-item">
                  <span className="label">Guardian Contact</span>
                  <span className="value phone-value">
                    <Phone size={14} /> {studentData?.guardianPhone || 'N/A'}
                  </span>
                </div>
                <div className="card-info-item">
                  <span className="label">Address</span>
                  <span className="value address-value">
                    <MapPin size={14} /> {studentData?.completeAddress || 'N/A'}
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
