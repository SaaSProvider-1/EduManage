import React, { useState } from "react";
import { Calendar, Clock, Send, MessageSquare, BookOpen } from "lucide-react";
import "./MakeRequest.css";

const MakeRequest = () => {
  const [formData, setFormData] = useState({
    requestType: "",
    subject: "",
    preferredDate: "",
    preferredTime: "",
    priority: "",
    description: "",
  });

  const [recentRequests] = useState([
    {
      id: 1,
      type: "Class Schedule",
      subject: "Advanced Mathematics",
      date: "2024-11-15",
      description: "Request for makeup class due to absence",
      status: "pending",
    },
    {
      id: 2,
      type: "Doubt Session",
      subject: "Physics",
      date: "2024-11-14",
      description: "Need help with quantum mechanics concepts",
      status: "approved",
    },
    {
      id: 3,
      type: "Extra Class",
      subject: "Chemistry",
      date: "2024-11-12",
      description: "Additional practice for upcoming exam",
      status: "completed",
    },
  ]);

  const requestTypes = [
    "Schedule Change",
    "Doubt Session",
    "Extra Class",
    "Assignment Extension",
    "Exam Query",
    "Other",
  ];

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Computer Science",
    "History",
    "Geography",
  ];

  const timeSlots = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM",
    "5:00 PM - 6:00 PM",
  ];

  const priorityLevels = ["Low", "Medium", "High", "Urgent"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting request:", formData);
    // Handle form submission logic here
    alert("Request submitted successfully!");

    // Reset form
    setFormData({
      requestType: "",
      subject: "",
      preferredDate: "",
      preferredTime: "",
      priority: "",
      description: "",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "pending", text: "pending" },
      approved: { class: "approved", text: "approved" },
      completed: { class: "completed", text: "completed" },
      rejected: { class: "rejected", text: "rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
    );
  };

  const getRequestIcon = (type) => {
    switch (type.toLowerCase()) {
      case "class schedule":
        return <Calendar size={16} />;
      case "doubt session":
        return <MessageSquare size={16} />;
      case "extra class":
        return <BookOpen size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="make-request">
      <div className="req-page-header">
        <h1>Make Request</h1>
        <p>Submit academic requests</p>
      </div>

      <div className="request-container">
        {/* Submit New Request Section */}
        <div className="submit-section">
          <div className="req-section-header">
            <div className="req-header-content">
              <span className="req-header">
                <MessageSquare className="req-header-icon" size={23} />
                <h2>Submit New Request</h2>
              </span>
              <div>
                <p>
                  Request for schedule changes, doubt sessions, or extra classes
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="request-form">
            <div className="req-form-row">
              <div className="req-form-group">
                <label htmlFor="requestType">Request Type *</label>
                <select
                  id="requestType"
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select request type</option>
                  {requestTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="req-form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="req-form-row">
              <div className="req-form-group">
                <label htmlFor="preferredDate">Preferred Date *</label>
                <div className="date-input-wrapper">
                  <Calendar className="input-icon" size={16} />
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    placeholder="Pick a date"
                    required
                  />
                </div>
              </div>

              <div className="req-form-group">
                <label htmlFor="preferredTime">Preferred Time</label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time, index) => (
                    <option key={index} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="req-form-group">
              <label htmlFor="priority">Priority Level</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="">Select priority</option>
                {priorityLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="req-form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please provide details about your request..."
                rows={4}
                required
              />
            </div>

            <button type="submit" className="submit-button">
              <Send size={16} />
              Submit Request
            </button>
          </form>
        </div>

        {/* Recent Requests Section */}
        <div className="recent-section">
          <div className="req-section-header">
            <div className="req-header-content">
              <span className="req-header">
                <Clock className="req-header-icon" size={23} />
                <h2>Recent Requests</h2>
              </span>
              <div>
                <p>Track the status of your submitted requests</p>
              </div>
            </div>
          </div>

          <div className="requests-list">
            {recentRequests.map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-header">
                  <div className="request-title">
                    {getRequestIcon(request.type)}
                    <span className="request-type">{request.type}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="request-details">
                  <div className="detail-item">
                    <span className="detail-label">Subject:</span>
                    <span className="detail-value">{request.subject}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{request.date}</span>
                  </div>
                </div>

                <p className="request-description">{request.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakeRequest;
