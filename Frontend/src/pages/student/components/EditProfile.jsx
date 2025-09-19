import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
  Camera,
  Save,
  ArrowLeft,
} from "lucide-react";
import "./EditProfile.css";

export default function EditProfile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bloodGroup: "",
    class: "",
    schoolName: "",
    lastSchoolAttended: "",
    fatherName: "",
    motherName: "",
    guardianPhone: "",
    completeAddress: "",
    profilePicture: null,
  });

  const [originalData, setOriginalData] = useState({});

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
        if (data.success) {
          const studentData = data.student;
          const profileData = {
            name: studentData.name || "",
            phone: studentData.phone || "",
            bloodGroup: studentData.bloodGroup || "",
            class: studentData.class || "",
            schoolName: studentData.schoolName || "",
            lastSchoolAttended: studentData.lastSchoolAttended || "",
            fatherName: studentData.fatherName || "",
            motherName: studentData.motherName || "",
            guardianPhone: studentData.guardianPhone || "",
            completeAddress: studentData.completeAddress || "",
            profilePicture: null,
          };
          setFormData(profileData);
          setOriginalData(profileData);
          setPreviewImage(studentData.photo);
        } else {
          setError(data.message || "Failed to fetch profile");
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError("Something went wrong while fetching profile.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    const token = localStorage.getItem("Token");
    if (!token) {
      setError("No token found. Please login again.");
      setIsSaving(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Only append fields that have been changed
      Object.keys(formData).forEach((key) => {
        if (key === "profilePicture" && formData[key]) {
          formDataToSend.append("profilePicture", formData[key]);
        } else if (
          key !== "profilePicture" &&
          formData[key] !== originalData[key]
        ) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch("http://localhost:3000/student/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => {
          navigate("/student/profile");
        }, 2000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Something went wrong while updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/student/profile");
  };

  if (isLoading) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-body">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-body">
        <div className="edit-profile-container">
          {/* Header */}
          <div className="edit-profile-header">
            <button
              type="button"
              className="back-button"
              onClick={handleCancel}
            >
              <ArrowLeft size={20} />
              Back to Profile
            </button>
            <h1>Edit Profile</h1>
            <p>Update your personal and academic information</p>
          </div>

          {/* Error and Success Messages */}
          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="edit-profile-form">
            {/* Profile Picture Section */}
            <div className="form-section">
              <h3>
                <Camera size={20} />
                Profile Picture
              </h3>
              <div className="profile-picture-upload">
                <div className="current-picture">
                  <img
                    src={previewImage || "/images/student-1-profile.png"}
                    alt="Profile"
                    className="profile-preview"
                  />
                </div>
                <div className="upload-controls">
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="profilePicture" className="file-input-label">
                    Choose New Picture
                  </label>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <h3>
                <User size={20} />
                Personal Information
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section">
              <h3>
                <GraduationCap size={20} />
                Academic Information
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="class">Current Class</label>
                  <input
                    type="text"
                    id="class"
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="schoolName">Current School</label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="lastSchoolAttended">
                    Last School Attended
                  </label>
                  <input
                    type="text"
                    id="lastSchoolAttended"
                    name="lastSchoolAttended"
                    value={formData.lastSchoolAttended}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div className="form-section">
              <h3>
                <Users size={20} />
                Family Information
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fatherName">Father's Name</label>
                  <input
                    type="text"
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="motherName">Mother's Name</label>
                  <input
                    type="text"
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="guardianPhone">Guardian Contact</label>
                  <input
                    type="tel"
                    id="guardianPhone"
                    name="guardianPhone"
                    value={formData.guardianPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="completeAddress">Complete Address</label>
                  <textarea
                    id="completeAddress"
                    name="completeAddress"
                    value={formData.completeAddress}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="button-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
